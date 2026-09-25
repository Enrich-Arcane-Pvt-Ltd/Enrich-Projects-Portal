<?php

namespace App\Http\Controllers;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
use App\Models\BackgroundService;
use App\Models\ClientAccessCredential;
use App\Models\IotConfiguration;
use App\Models\Project;
use App\Models\ProjectCredential;
use App\Models\ProjectDocument;
use App\Models\ProjectLink;
use App\Models\ServerEnvironment;
use App\Models\ThirdPartyAccount;
use App\Models\User;
use App\Services\AuditService;
use App\Services\PortalNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProjectManagementController extends Controller
{
    /**
     * Ensure the authenticated user is the creator of the project
     */
    protected function authorizeCreator(Request $request, Project $project): void
    {
        if ($project->created_by_id !== $request->user()->id) {
            abort(403, 'Permission denied: Only the project creator can modify or manage this project.');
        }
    }

    /**
     * Create a new project (Developer role is the main controller)
     */
    public function storeProject(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:projects,code',
            'type' => ['required', Rule::enum(ProjectType::class)],
            'status' => ['required', Rule::enum(ProjectStatus::class)],
            'priority' => ['required', Rule::enum(ProjectPriority::class)],
            'tech_stack' => 'nullable|string|max:500',
            'description' => 'nullable|string',
        ]);

        $validated['created_by_id'] = $request->user()->id;
        $validated['lead_developer_id'] = $request->user()->id;

        $project = Project::create($validated);

        // Attach creator to project_user pivot
        $project->developers()->syncWithoutDetaching([$request->user()->id]);

        PortalNotificationService::notifyProjectCreated($project, $request->user(), [$request->user()->id]);

        if ($project->status === ProjectStatus::COMPLETED->value) {
            PortalNotificationService::notifyProjectCompleted($project, $request->user());
        }

        AuditService::log(
            $project->id,
            'CREATED_PROJECT',
            "Created project {$project->name} [{$project->code}]"
        );

        return redirect()->back()->with('success', "Project '{$project->name}' created successfully.");
    }

    /**
     * Update project metadata
     */
    public function updateProject(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);

        if (! $isAdmin) {
            $this->authorizeCreator($request, $project);

            // If project is currently completed, check edit permission
            if ($project->status === ProjectStatus::COMPLETED->value && $project->edit_permission_status !== 'approved') {
                return redirect()->back()->withErrors([
                    'status' => "Permission denied: Project '{$project->name}' is marked as Completed and locked for editing. Please request edit permission from an administrator.",
                ]);
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['required', 'string', 'max:50', Rule::unique('projects', 'code')->ignore($project->id)],
            'type' => ['required', Rule::enum(ProjectType::class)],
            'status' => ['required', Rule::enum(ProjectStatus::class)],
            'priority' => ['required', Rule::enum(ProjectPriority::class)],
            'tech_stack' => 'nullable|string|max:500',
            'description' => 'nullable|string',
        ]);

        $wasCompleted = $project->status === ProjectStatus::COMPLETED->value;
        $isNowCompleted = $validated['status'] === ProjectStatus::COMPLETED->value;

        $project->update($validated);

        // 1. If project was updated to Completed -> notify admin & superadmin
        if (! $wasCompleted && $isNowCompleted) {
            PortalNotificationService::notifyProjectCompleted($project, $user);
        }

        // 2. If edit was performed under approved permission, consume the permission
        if ($project->edit_permission_status === 'approved') {
            $project->update([
                'edit_permission_status' => null,
                'edit_permission_admin_id' => null,
                'edit_permission_reason' => null,
                'edit_permission_requested_at' => null,
                'edit_permission_approved_at' => null,
                'edit_permission_approved_by_id' => null,
                'edit_permission_rejected_at' => null,
                'edit_permission_rejection_reason' => null,
            ]);
        }

        AuditService::log(
            $project->id,
            'UPDATED_PROJECT',
            "Updated project details for {$project->name}"
        );

        return redirect()->back()->with('success', "Project '{$project->name}' updated successfully.");
    }

    /**
     * Request project edit permission from an administrator for completed project
     */
    public function requestEditPermission(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        if ($project->status !== ProjectStatus::COMPLETED->value) {
            return redirect()->back()->with('info', "Project '{$project->name}' is not marked as completed. You can edit it directly.");
        }

        $validated = $request->validate([
            'admin_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(fn ($q) => $q->whereIn('role', ['admin', 'superadmin'])),
            ],
            'reason' => 'nullable|string|max:1000',
        ]);

        $admin = User::findOrFail($validated['admin_id']);
        $user = $request->user();

        $project->update([
            'edit_permission_status' => 'pending',
            'edit_permission_admin_id' => $admin->id,
            'edit_permission_reason' => $validated['reason'] ?? null,
            'edit_permission_requested_at' => now(),
            'edit_permission_approved_at' => null,
            'edit_permission_approved_by_id' => null,
            'edit_permission_rejected_at' => null,
            'edit_permission_rejection_reason' => null,
        ]);

        AuditService::log(
            $project->id,
            'REQUESTED_EDIT_PERMISSION',
            "Developer {$user->name} requested edit permission from Admin {$admin->name}" . (filled($validated['reason'] ?? null) ? " - Reason: {$validated['reason']}" : '')
        );

        PortalNotificationService::notifyEditPermissionRequested($project, $admin, $user, $validated['reason'] ?? null);

        return redirect()->back()->with('success', "Edit permission request submitted to {$admin->name}. You will be notified once approved.");
    }

    /**
     * Cancel / withdraw a pending project edit permission request
     */
    public function cancelEditPermissionRequest(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $project->update([
            'edit_permission_status' => null,
            'edit_permission_admin_id' => null,
            'edit_permission_reason' => null,
            'edit_permission_requested_at' => null,
            'edit_permission_approved_at' => null,
            'edit_permission_approved_by_id' => null,
            'edit_permission_rejected_at' => null,
            'edit_permission_rejection_reason' => null,
        ]);

        AuditService::log(
            $project->id,
            'CANCELLED_EDIT_PERMISSION_REQUEST',
            "Developer {$request->user()->name} withdrew edit permission request for project {$project->name}"
        );

        return redirect()->back()->with('info', "Edit permission request for project '{$project->name}' has been cancelled.");
    }

    /**
     * Request project deletion approval from an administrator
     */
    public function requestDeletion(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $validated = $request->validate([
            'admin_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(fn ($q) => $q->whereIn('role', ['admin', 'superadmin'])),
            ],
            'reason' => 'nullable|string|max:1000',
        ]);

        $admin = User::findOrFail($validated['admin_id']);
        $user = $request->user();

        $project->update([
            'deletion_status' => 'pending',
            'deletion_admin_id' => $admin->id,
            'deletion_reason' => $validated['reason'] ?? null,
            'deletion_requested_at' => now(),
            'deletion_approved_at' => null,
            'deletion_approved_by_id' => null,
            'deletion_rejected_at' => null,
            'deletion_rejection_reason' => null,
        ]);

        AuditService::log(
            $project->id,
            'REQUESTED_PROJECT_DELETION',
            "Developer {$user->name} requested deletion approval from Admin {$admin->name}" . (filled($validated['reason'] ?? null) ? " - Reason: {$validated['reason']}" : '')
        );

        // Send Filament database notification to the chosen administrator
        PortalNotificationService::notifyDeletionRequested($project, $admin, $user, $validated['reason'] ?? null);

        return redirect()->back()->with('success', "Deletion request submitted to {$admin->name}. Waiting for administrative approval.");
    }

    /**
     * Cancel / withdraw a pending project deletion request
     */
    public function cancelDeletionRequest(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $project->update([
            'deletion_status' => null,
            'deletion_admin_id' => null,
            'deletion_reason' => null,
            'deletion_requested_at' => null,
            'deletion_approved_at' => null,
            'deletion_approved_by_id' => null,
            'deletion_rejected_at' => null,
            'deletion_rejection_reason' => null,
        ]);

        AuditService::log(
            $project->id,
            'CANCELLED_PROJECT_DELETION_REQUEST',
            "Developer {$request->user()->name} withdrew the deletion request for project {$project->name}"
        );

        return redirect()->back()->with('info', "Deletion request for project '{$project->name}' has been cancelled.");
    }

    /**
     * Delete project (requires approved deletion request for developers)
     */
    public function deleteProject(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);

        if (! $isAdmin) {
            $this->authorizeCreator($request, $project);

            if ($project->deletion_status !== 'approved') {
                abort(403, 'Permission denied: Project deletion requires approval from an administrator.');
            }
        }

        $name = $project->name;
        $code = $project->code;
        $approver = $project->deletionApprovedBy;

        AuditService::log(
            null,
            'DELETED_PROJECT',
            "Deleted project {$name} [{$code}] by {$user->name}"
        );

        $project->delete();

        PortalNotificationService::notifyApprovedProjectDeleted($name, $code, $user, $approver);

        return redirect()->route('dashboard')->with('success', "Project '{$name}' deleted successfully.");
    }

    // ==========================================
    // CREDENTIALS VAULT
    // ==========================================

    public function storeCredential(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $validated = $request->validate([
            'category' => ['required', Rule::in(['api_key', 'webhook_secret', 'oauth_token', 'ssh_key', 'db_password'])],
            'key_name' => 'required|string|max:255',
            'key_value' => 'required|string',
            'environment' => ['required', Rule::in(['local', 'staging', 'production'])],
        ]);

        $validated['project_id'] = $project->id;
        $cred = ProjectCredential::create($validated);

        AuditService::log($project->id, 'ADDED_CREDENTIAL', "Added credential: {$cred->key_name} [{$cred->environment}]");

        return redirect()->back()->with('success', 'Secret added to Credentials Vault.');
    }

    public function updateCredential(Request $request, Project $project, ProjectCredential $credential): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($credential->project_id !== $project->id, 404);

        $validated = $request->validate([
            'category' => ['required', Rule::in(['api_key', 'webhook_secret', 'oauth_token', 'ssh_key', 'db_password'])],
            'key_name' => 'required|string|max:255',
            'key_value' => 'nullable|string',
            'environment' => ['required', Rule::in(['local', 'staging', 'production'])],
        ]);

        if (empty($validated['key_value'])) {
            unset($validated['key_value']);
        }

        $credential->update($validated);

        AuditService::log($project->id, 'UPDATED_CREDENTIAL', "Updated credential: {$credential->key_name} [{$credential->environment}]");

        return redirect()->back()->with('success', 'Credential updated.');
    }

    public function deleteCredential(Request $request, Project $project, ProjectCredential $credential): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($credential->project_id !== $project->id, 404);

        $keyName = $credential->key_name;
        $credential->delete();

        AuditService::log($project->id, 'DELETED_CREDENTIAL', "Deleted credential: {$keyName}");

        return redirect()->back()->with('success', 'Credential removed.');
    }

    // ==========================================
    // CLIENT ACCESS CREDENTIALS
    // ==========================================

    public function storeClientCredential(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $validated = $request->validate([
            'username' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'password' => 'required|string',
            'role' => 'nullable|string|max:255',
            'login_url' => 'nullable|url|max:500',
            'environment' => ['required', Rule::in(['local', 'staging', 'production'])],
            'notes' => 'nullable|string',
        ]);

        $validated['project_id'] = $project->id;
        $clientCred = ClientAccessCredential::create($validated);

        AuditService::log($project->id, 'ADDED_CLIENT_CREDENTIAL', "Added client access: {$clientCred->username}");

        return redirect()->back()->with('success', 'Client access credential added.');
    }

    public function updateClientCredential(Request $request, Project $project, ClientAccessCredential $credential): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($credential->project_id !== $project->id, 404);

        $validated = $request->validate([
            'username' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'password' => 'nullable|string',
            'role' => 'nullable|string|max:255',
            'login_url' => 'nullable|url|max:500',
            'environment' => ['required', Rule::in(['local', 'staging', 'production'])],
            'notes' => 'nullable|string',
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $credential->update($validated);

        AuditService::log($project->id, 'UPDATED_CLIENT_CREDENTIAL', "Updated client access: {$credential->username}");

        return redirect()->back()->with('success', 'Client credential updated.');
    }

    public function deleteClientCredential(Request $request, Project $project, ClientAccessCredential $credential): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($credential->project_id !== $project->id, 404);

        $username = $credential->username;
        $credential->delete();

        AuditService::log($project->id, 'DELETED_CLIENT_CREDENTIAL', "Deleted client access: {$username}");

        return redirect()->back()->with('success', 'Client credential removed.');
    }

    // ==========================================
    // REPOSITORIES & EXTERNAL LINKS
    // ==========================================

    public function storeLink(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $validated = $request->validate([
            'category' => ['required', Rule::in(['github', 'gitlab', 'bitbucket', 'figma', 'postman', 'jira'])],
            'title' => 'required|string|max:255',
            'url' => 'required|url|max:500',
            'branch_strategy' => 'nullable|string|max:255',
        ]);

        $validated['project_id'] = $project->id;
        $link = ProjectLink::create($validated);

        AuditService::log($project->id, 'ADDED_LINK', "Linked repository: {$link->title}");

        return redirect()->back()->with('success', 'Repository/Link added.');
    }

    public function updateLink(Request $request, Project $project, ProjectLink $link): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($link->project_id !== $project->id, 404);

        $validated = $request->validate([
            'category' => ['required', Rule::in(['github', 'gitlab', 'bitbucket', 'figma', 'postman', 'jira'])],
            'title' => 'required|string|max:255',
            'url' => 'required|url|max:500',
            'branch_strategy' => 'nullable|string|max:255',
        ]);

        $link->update($validated);

        AuditService::log($project->id, 'UPDATED_LINK', "Updated repository link: {$link->title}");

        return redirect()->back()->with('success', 'Repository/Link updated.');
    }

    public function deleteLink(Request $request, Project $project, ProjectLink $link): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($link->project_id !== $project->id, 404);

        $title = $link->title;
        $link->delete();

        AuditService::log($project->id, 'DELETED_LINK', "Removed repository link: {$title}");

        return redirect()->back()->with('success', 'Link removed.');
    }

    // ==========================================
    // SERVERS & ENVIRONMENTS
    // ==========================================

    public function storeServer(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $validated = $request->validate([
            'environment_type' => ['required', Rule::in(['development', 'staging', 'production'])],
            'hosting_provider' => 'required|string|max:255',
            'ip_address' => 'nullable|string|max:100',
            'hostname' => 'nullable|string|max:255',
            'ssh_port' => 'required|integer|min:1|max:65535',
            'ssh_user' => 'required|string|max:100',
            'ssh_credential' => 'nullable|string',
            'runtime_stack' => 'nullable|string|max:255',
            'deploy_path' => 'nullable|string|max:255',
            'env_backup' => 'nullable|string',
        ]);

        $validated['project_id'] = $project->id;
        $server = ServerEnvironment::create($validated);

        AuditService::log($project->id, 'ADDED_SERVER', "Added server environment: {$server->hosting_provider} [{$server->environment_type}]");

        return redirect()->back()->with('success', 'Server environment configured.');
    }

    public function updateServer(Request $request, Project $project, ServerEnvironment $server): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($server->project_id !== $project->id, 404);

        $validated = $request->validate([
            'environment_type' => ['required', Rule::in(['development', 'staging', 'production'])],
            'hosting_provider' => 'required|string|max:255',
            'ip_address' => 'nullable|string|max:100',
            'hostname' => 'nullable|string|max:255',
            'ssh_port' => 'required|integer|min:1|max:65535',
            'ssh_user' => 'required|string|max:100',
            'ssh_credential' => 'nullable|string',
            'runtime_stack' => 'nullable|string|max:255',
            'deploy_path' => 'nullable|string|max:255',
            'env_backup' => 'nullable|string',
        ]);

        if (empty($validated['ssh_credential'])) {
            unset($validated['ssh_credential']);
        }

        $server->update($validated);

        AuditService::log($project->id, 'UPDATED_SERVER', "Updated server environment: {$server->hosting_provider} [{$server->environment_type}]");

        return redirect()->back()->with('success', 'Server environment updated.');
    }

    public function deleteServer(Request $request, Project $project, ServerEnvironment $server): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($server->project_id !== $project->id, 404);

        $name = "{$server->hosting_provider} [{$server->environment_type}]";
        $server->delete();

        AuditService::log($project->id, 'DELETED_SERVER', "Deleted server environment: {$name}");

        return redirect()->back()->with('success', 'Server environment removed.');
    }

    // ==========================================
    // THIRD-PARTY ACCOUNTS
    // ==========================================

    public function storeThirdPartyAccount(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $validated = $request->validate([
            'service_provider' => 'required|string|max:255',
            'account_identifier' => 'required|string|max:255',
            'login_password' => 'nullable|string',
            'console_url' => 'nullable|url|max:500',
            'project_or_app_id' => 'nullable|string|max:255',
            'environment' => ['required', Rule::in(['development', 'testing', 'production'])],
            'notes' => 'nullable|string',
        ]);

        $validated['project_id'] = $project->id;
        $acc = ThirdPartyAccount::create($validated);

        AuditService::log($project->id, 'ADDED_ACCOUNT', "Added platform account: {$acc->service_provider} ({$acc->account_identifier})");

        return redirect()->back()->with('success', 'Third-party account registered.');
    }

    public function updateThirdPartyAccount(Request $request, Project $project, ThirdPartyAccount $account): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($account->project_id !== $project->id, 404);

        $validated = $request->validate([
            'service_provider' => 'required|string|max:255',
            'account_identifier' => 'required|string|max:255',
            'login_password' => 'nullable|string',
            'console_url' => 'nullable|url|max:500',
            'project_or_app_id' => 'nullable|string|max:255',
            'environment' => ['required', Rule::in(['development', 'testing', 'production'])],
            'notes' => 'nullable|string',
        ]);

        if (empty($validated['login_password'])) {
            unset($validated['login_password']);
        }

        $account->update($validated);

        AuditService::log($project->id, 'UPDATED_ACCOUNT', "Updated platform account: {$account->service_provider}");

        return redirect()->back()->with('success', 'Third-party account updated.');
    }

    public function deleteThirdPartyAccount(Request $request, Project $project, ThirdPartyAccount $account): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($account->project_id !== $project->id, 404);

        $desc = "{$account->service_provider} ({$account->account_identifier})";
        $account->delete();

        AuditService::log($project->id, 'DELETED_ACCOUNT', "Removed platform account: {$desc}");

        return redirect()->back()->with('success', 'Third-party account removed.');
    }

    // ==========================================
    // BACKGROUND SERVICES & DAEMONS
    // ==========================================

    public function storeBackgroundService(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $validated = $request->validate([
            'service_type' => ['required', Rule::in(['cron_schedule', 'queue_worker', 'supervisor_daemon', 'websocket'])],
            'command' => 'required|string|max:500',
            'frequency_or_config' => 'nullable|string|max:255',
            'monitoring_notes' => 'nullable|string',
        ]);

        $validated['project_id'] = $project->id;
        $service = BackgroundService::create($validated);

        AuditService::log($project->id, 'ADDED_SERVICE', "Added worker: {$service->service_type}");

        return redirect()->back()->with('success', 'Background service registered.');
    }

    public function updateBackgroundService(Request $request, Project $project, BackgroundService $service): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($service->project_id !== $project->id, 404);

        $validated = $request->validate([
            'service_type' => ['required', Rule::in(['cron_schedule', 'queue_worker', 'supervisor_daemon', 'websocket'])],
            'command' => 'required|string|max:500',
            'frequency_or_config' => 'nullable|string|max:255',
            'monitoring_notes' => 'nullable|string',
        ]);

        $service->update($validated);

        AuditService::log($project->id, 'UPDATED_SERVICE', "Updated worker: {$service->service_type}");

        return redirect()->back()->with('success', 'Background service updated.');
    }

    public function deleteBackgroundService(Request $request, Project $project, BackgroundService $service): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($service->project_id !== $project->id, 404);

        $type = $service->service_type;
        $service->delete();

        AuditService::log($project->id, 'DELETED_SERVICE', "Removed worker: {$type}");

        return redirect()->back()->with('success', 'Background service removed.');
    }

    // ==========================================
    // IOT HARDWARE & TELEMETRY
    // ==========================================

    public function storeIotConfiguration(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $validated = $request->validate([
            'hardware_model' => 'required|string|max:255',
            'firmware_version' => 'nullable|string|max:100',
            'communication_protocol' => ['required', Rule::in(['MQTT', 'HTTP_REST', 'WebSockets'])],
            'broker_url' => 'nullable|string|max:255',
            'port' => 'nullable|string|max:50',
            'topic_structure' => 'nullable|string|max:500',
            'auth_token_or_certs' => 'nullable|string',
        ]);

        $validated['project_id'] = $project->id;
        $iot = IotConfiguration::create($validated);

        AuditService::log($project->id, 'ADDED_IOT', "Added hardware node: {$iot->hardware_model}");

        return redirect()->back()->with('success', 'IoT configuration registered.');
    }

    public function updateIotConfiguration(Request $request, Project $project, IotConfiguration $iot): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($iot->project_id !== $project->id, 404);

        $validated = $request->validate([
            'hardware_model' => 'required|string|max:255',
            'firmware_version' => 'nullable|string|max:100',
            'communication_protocol' => ['required', Rule::in(['MQTT', 'HTTP_REST', 'WebSockets'])],
            'broker_url' => 'nullable|string|max:255',
            'port' => 'nullable|string|max:50',
            'topic_structure' => 'nullable|string|max:500',
            'auth_token_or_certs' => 'nullable|string',
        ]);

        if (empty($validated['auth_token_or_certs'])) {
            unset($validated['auth_token_or_certs']);
        }

        $iot->update($validated);

        AuditService::log($project->id, 'UPDATED_IOT', "Updated hardware node: {$iot->hardware_model}");

        return redirect()->back()->with('success', 'IoT configuration updated.');
    }

    public function deleteIotConfiguration(Request $request, Project $project, IotConfiguration $iot): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($iot->project_id !== $project->id, 404);

        $model = $iot->hardware_model;
        $iot->delete();

        AuditService::log($project->id, 'DELETED_IOT', "Removed hardware node: {$model}");

        return redirect()->back()->with('success', 'IoT node removed.');
    }

    // ==========================================
    // DOCUMENTS VAULT
    // ==========================================

    public function storeDocument(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'file' => 'nullable|file|max:51200', // up to 50MB
            'file_url' => 'nullable|string|max:500',
        ]);

        if (! $request->hasFile('file') && empty(trim($validated['file_url'] ?? ''))) {
            return redirect()->back()->withErrors([
                'file' => 'Please either upload a document/archive file or provide an external link.',
            ]);
        }

        $filePath = '';
        $fileType = 'external';
        $fileSize = 0;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filePath = $file->store("documents/{$project->code}", 'public');
            $fileType = strtolower($file->getClientOriginalExtension() ?: 'file');
            $fileSize = $file->getSize();
        } else {
            $url = trim($validated['file_url'] ?? '');
            if (! preg_match('~^(?:f|ht)tps?://~i', $url)) {
                $url = 'https://' . $url;
            }
            $filePath = $url;
            $fileType = 'external';
        }

        ProjectDocument::create([
            'project_id' => $project->id,
            'title' => $validated['title'],
            'file_path' => $filePath,
            'file_type' => $fileType,
            'file_size' => $fileSize,
        ]);

        AuditService::log($project->id, 'UPLOADED_DOC', "Added document: {$validated['title']}");

        return redirect()->back()->with('success', 'Document registered.');
    }

    public function updateDocument(Request $request, Project $project, ProjectDocument $document): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($document->project_id !== $project->id, 404);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'file' => 'nullable|file|max:51200',
            'file_url' => 'nullable|string|max:500',
        ]);

        $updateData = [
            'title' => $validated['title'],
        ];

        if ($request->hasFile('file')) {
            // Delete old file if it was locally stored
            if ($document->file_type !== 'external' && Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
            }
            $file = $request->file('file');
            $updateData['file_path'] = $file->store("documents/{$project->code}", 'public');
            $updateData['file_type'] = strtolower($file->getClientOriginalExtension() ?: 'file');
            $updateData['file_size'] = $file->getSize();
        } elseif (! empty(trim($validated['file_url'] ?? ''))) {
            $url = trim($validated['file_url']);
            if (! preg_match('~^(?:f|ht)tps?://~i', $url)) {
                $url = 'https://' . $url;
            }
            $updateData['file_path'] = $url;
            $updateData['file_type'] = 'external';
            $updateData['file_size'] = 0;
        }

        $document->update($updateData);

        AuditService::log($project->id, 'UPDATED_DOC', "Updated document: {$document->title}");

        return redirect()->back()->with('success', 'Document updated successfully.');
    }

    public function deleteDocument(Request $request, Project $project, ProjectDocument $document): RedirectResponse
    {
        $this->authorizeCreator($request, $project);
        abort_if($document->project_id !== $project->id, 404);

        $title = $document->title;
        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        AuditService::log($project->id, 'DELETED_DOC', "Removed document: {$title}");

        return redirect()->back()->with('success', 'Document removed.');
    }

    public function downloadDocument(Request $request, Project $project, ProjectDocument $document): mixed
    {
        abort_if($document->project_id !== $project->id, 404);

        if ($document->file_type === 'external' || str_starts_with($document->file_path, 'http')) {
            return redirect()->away($document->file_path);
        }

        if (! Storage::disk('public')->exists($document->file_path)) {
            if (file_exists(public_path('storage/' . $document->file_path))) {
                return response()->download(public_path('storage/' . $document->file_path));
            }
            abort(404, 'The requested document file could not be found on the server.');
        }

        AuditService::log($project->id, 'DOWNLOADED_DOC', "Downloaded document: {$document->title}");

        $ext = pathinfo($document->file_path, PATHINFO_EXTENSION);
        $title = trim($document->title);
        $cleanTitle = preg_replace('/[^\w\s\.-]/u', '_', $title);
        if ($ext && ! str_ends_with(strtolower($cleanTitle), '.' . strtolower($ext))) {
            $cleanTitle .= '.' . $ext;
        }

        return Storage::disk('public')->download($document->file_path, $cleanTitle ?: basename($document->file_path));
    }

    // ==========================================
    // DEVELOPER TEAM ASSIGNMENTS & ROLES
    // ==========================================

    /**
     * Assign a developer to the project team
     */
    public function assignDeveloper(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($validated['user_id']);
        $project->developers()->syncWithoutDetaching([$user->id]);

        PortalNotificationService::notifyDeveloperAssigned($project, $user, $request->user());

        AuditService::log(
            $project->id,
            'ASSIGNED_DEVELOPER',
            "Assigned developer {$user->name} ({$user->email}) to project team"
        );

        return redirect()->back()->with('success', "Developer '{$user->name}' assigned to project successfully.");
    }

    /**
     * Unassign a developer from the project team
     */
    public function unassignDeveloper(Request $request, Project $project, User $user): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        // Disallow removing the creator from their own project
        if ($user->id === $project->created_by_id) {
            return redirect()->back()->with('error', 'Cannot remove the project creator from the project.');
        }

        $project->developers()->detach($user->id);

        if ($project->lead_developer_id === $user->id) {
            $project->update(['lead_developer_id' => null]);
        }

        AuditService::log(
            $project->id,
            'UNASSIGNED_DEVELOPER',
            "Removed developer {$user->name} ({$user->email}) from project team"
        );

        return redirect()->back()->with('success', "Developer '{$user->name}' unassigned from project.");
    }

    /**
     * Update project leadership roles (Lead Developer, Project Manager)
     */
    public function updateLeads(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeCreator($request, $project);

        $validated = $request->validate([
            'lead_developer_id' => 'nullable|exists:users,id',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $project->update([
            'lead_developer_id' => $validated['lead_developer_id'] ?: null,
            'manager_id' => $validated['manager_id'] ?: null,
        ]);

        if (! empty($validated['lead_developer_id'])) {
            $project->developers()->syncWithoutDetaching([$validated['lead_developer_id']]);
        }

        AuditService::log(
            $project->id,
            'UPDATED_PROJECT_LEADS',
            "Updated lead developer / project manager roles for {$project->name}"
        );

        return redirect()->back()->with('success', 'Project leadership roles updated successfully.');
    }
}
