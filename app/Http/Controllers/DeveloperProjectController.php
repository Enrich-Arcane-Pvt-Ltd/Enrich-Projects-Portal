<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Project;
use App\Models\ProjectCredential;
use App\Models\ProjectDocument;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class DeveloperProjectController extends Controller
{
    /**
     * Display the developer's assigned projects dashboard
     */
    public function index(Request $request): Response | SymfonyResponse
    {
        $user = $request->user();

        if (in_array($user->role, ['admin', 'superadmin'])) {
            return Inertia::location('/admin');
        }

        // Query projects: Developers and admins see all projects in the company vault
        $query = Project::query()
            ->with([
                'creator:id,name,email,avatar_url',
                'leadDeveloper:id,name,email,avatar_url',
                'manager:id,name,email,avatar_url',
                'developers:id,name,email,role,avatar_url',
                'links',
                'serverEnvironments',
                'thirdPartyAccounts',
                'credentials',
                'backgroundServices',
                'iotConfigurations',
                'documents',
                'clientAccessCredentials',
            ]);

        // Search and Filters
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('tech_stack', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }

        // Count user audit log interactions per project to gauge historical access frequency
        $userAuditAccessCounts = AuditLog::where('user_id', $user->id)
            ->whereNotNull('project_id')
            ->selectRaw('project_id, count(*) as count')
            ->groupBy('project_id')
            ->pluck('count', 'project_id');

        $projects = $query->latest('updated_at')->get()->map(function ($project) use ($user, $userAuditAccessCounts) {
            $project->is_owner = $project->created_by_id === $user->id;
            $project->is_assigned = $project->lead_developer_id === $user->id
                || $project->manager_id === $user->id
                || $project->developers->contains('id', $user->id);
            $project->access_count = (int) ($userAuditAccessCounts[$project->id] ?? 0);

            return $project;
        });

        // Calculate overview stats
        $allProjects = Project::withCount(['credentials', 'serverEnvironments', 'links'])->get();
        $assignedCount = $allProjects->filter(function ($p) use ($user) {
            return $p->lead_developer_id === $user->id
                || $p->manager_id === $user->id
                || $p->developers->contains('id', $user->id);
        })->count();

        $stats = [
            'total_projects' => $allProjects->count(),
            'my_created_projects' => $allProjects->where('created_by_id', $user->id)->count(),
            'other_developers_projects' => $allProjects->filter(fn ($p) => $p->created_by_id !== $user->id)->count(),
            'my_assigned_projects' => $assignedCount,
            'active_projects' => $allProjects->where('status', 'in_progress')->count(),
            'critical_projects' => $allProjects->where('priority', 'critical')->count(),
            'total_credentials' => $allProjects->sum('credentials_count'),
            'total_servers' => $allProjects->sum('server_environments_count'),
        ];

        // Recent audit events for this user
        $recentAuditActivity = AuditLog::where('user_id', $user->id)
            ->latest('created_at')
            ->take(5)
            ->get();

        return Inertia::render('Dashboard', [
            'projects' => $projects,
            'stats' => $stats,
            'recentAuditActivity' => $recentAuditActivity,
            'availableDevelopers' => User::select('id', 'name', 'email', 'role')->orderBy('name')->get(),
            'filters' => $request->only(['search', 'type', 'status', 'priority']),
        ]);
    }

    /**
     * Securely reveal a decrypted secret and log the access in audit vault
     */
    public function revealSecret(Request $request, ProjectCredential $credential): JsonResponse
    {
        $user = $request->user();

        // Authorize access
        if (! $this->userCanAccessProject($user, $credential->project_id)) {
            abort(403, 'Unauthorized access to this project secret.');
        }

        // Log to Audit Vault
        AuditService::log(
            $credential->project_id,
            'VIEWED_SECRET',
            "{$credential->key_name} [{$credential->environment}]"
        );

        return response()->json([
            'id' => $credential->id,
            'key_name' => $credential->key_name,
            'key_value' => $credential->key_value,
            'environment' => $credential->environment,
        ]);
    }

    /**
     * Record a secret or credential copy action to audit vault
     */
    public function logCopy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'target_field' => 'required|string',
            'action_type' => 'nullable|string',
        ]);

        $user = $request->user();

        if (! $this->userCanAccessProject($user, $validated['project_id'])) {
            abort(403, 'Unauthorized.');
        }

        AuditService::log(
            $validated['project_id'],
            $validated['action_type'] ?? 'COPIED_KEY',
            $validated['target_field']
        );

        return response()->json(['success' => true]);
    }

    /**
     * Reveal third-party login password with audit logging
     */
    public function revealAccountPassword(Request $request, int $accountId): JsonResponse
    {
        $account = \App\Models\ThirdPartyAccount::findOrFail($accountId);
        $user = $request->user();

        if (! $this->userCanAccessProject($user, $account->project_id)) {
            abort(403, 'Unauthorized.');
        }

        AuditService::log(
            $account->project_id,
            'VIEWED_SECRET',
            "Account Password: {$account->service_provider} ({$account->account_identifier})"
        );

        return response()->json([
            'id' => $account->id,
            'login_password' => $account->login_password,
        ]);
    }

    /**
     * Reveal client access credential password with audit logging
     */
    public function revealClientCredential(Request $request, int $id): JsonResponse
    {
        $cred = \App\Models\ClientAccessCredential::findOrFail($id);
        $user = $request->user();

        if (! $this->userCanAccessProject($user, $cred->project_id)) {
            abort(403, 'Unauthorized.');
        }

        $desc = "Client Credential: {$cred->username}" . ($cred->email ? " ({$cred->email})" : "");
        AuditService::log(
            $cred->project_id,
            'VIEWED_SECRET',
            $desc
        );

        return response()->json([
            'id' => $cred->id,
            'password' => $cred->password,
        ]);
    }

    /**
     * Reveal SSH credential or .env with audit logging
     */
    public function revealServerSecret(Request $request, int $serverId): JsonResponse
    {
        $server = \App\Models\ServerEnvironment::findOrFail($serverId);
        $user = $request->user();

        if (! $this->userCanAccessProject($user, $server->project_id)) {
            abort(403, 'Unauthorized.');
        }

        $type = $request->query('type', 'ssh'); // 'ssh' or 'env'
        $targetDesc = $type === 'env'
            ? "Active .env Backup [{$server->environment_type} - {$server->hosting_provider}]"
            : "SSH Credential [{$server->environment_type} - {$server->ssh_user}@{$server->ip_address}]";

        AuditService::log(
            $server->project_id,
            $type === 'env' ? 'EXPORTED_ENV' : 'VIEWED_SECRET',
            $targetDesc
        );

        return response()->json([
            'id' => $server->id,
            'value' => $type === 'env' ? $server->env_backup : $server->ssh_credential,
            'type' => $type,
        ]);
    }

    private function userCanAccessProject($user, int $projectId): bool
    {
        return $user !== null;
    }
}
