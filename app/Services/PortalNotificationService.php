<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class PortalNotificationService
{
    /**
     * 1. Notify admin when developer requests project deletion
     */
    public static function notifyDeletionRequested(Project $project, User $admin, User $developer, ?string $reason = null): void
    {
        try {
            Notification::make()
                ->title('Project Deletion Approval Request')
                ->icon('heroicon-o-trash')
                ->warning()
                ->body("Developer {$developer->name} requested approval to delete project '{$project->name}' ({$project->code})." . (filled($reason) ? "\nReason: {$reason}" : ''))
                ->actions([
                    Action::make('review')
                        ->button()
                        ->label('Review Request')
                        ->url("/admin/projects?search=" . urlencode($project->code)),
                ])
                ->sendToDatabase($admin);
        } catch (\Throwable $e) {
            Log::error('PortalNotificationService::notifyDeletionRequested error: ' . $e->getMessage());
        }
    }

    /**
     * 1b. Notify developer when admin approves project deletion
     */
    public static function notifyDeletionApproved(Project $project, User $admin, User $developer): void
    {
        try {
            Notification::make()
                ->title('Project Deletion Approved')
                ->icon('heroicon-o-check-circle')
                ->success()
                ->body("Admin {$admin->name} approved your deletion request for project '{$project->name}' ({$project->code}). You may now finalize deleting this project from your dashboard.")
                ->actions([
                    Action::make('view_dashboard')
                        ->button()
                        ->label('Open Dashboard')
                        ->url('/dashboard'),
                ])
                ->sendToDatabase($developer);
        } catch (\Throwable $e) {
            Log::error('PortalNotificationService::notifyDeletionApproved error: ' . $e->getMessage());
        }
    }

    /**
     * 1c. Notify developer when admin rejects project deletion
     */
    public static function notifyDeletionRejected(Project $project, User $admin, User $developer, string $reason): void
    {
        try {
            Notification::make()
                ->title('Project Deletion Rejected')
                ->icon('heroicon-o-x-circle')
                ->danger()
                ->body("Admin {$admin->name} rejected your deletion request for project '{$project->name}' ({$project->code}). Reason: {$reason}")
                ->actions([
                    Action::make('view_dashboard')
                        ->button()
                        ->label('Open Dashboard')
                        ->url('/dashboard'),
                ])
                ->sendToDatabase($developer);
        } catch (\Throwable $e) {
            Log::error('PortalNotificationService::notifyDeletionRejected error: ' . $e->getMessage());
        }
    }

    /**
     * 1d. When project is deleted by developer (approved deletion), notify developer and the approving admin
     */
    public static function notifyApprovedProjectDeleted(string $projectName, string $projectCode, User $developer, ?User $approvedByAdmin): void
    {
        try {
            // Notify the deleting developer
            Notification::make()
                ->title('Project Deleted')
                ->icon('heroicon-o-trash')
                ->info()
                ->body("You have permanently deleted project '{$projectName}' [{$projectCode}].")
                ->sendToDatabase($developer);

            // Notify the admin who approved it if distinct
            if ($approvedByAdmin && $approvedByAdmin->id !== $developer->id) {
                Notification::make()
                    ->title('Approved Project Deleted')
                    ->icon('heroicon-o-trash')
                    ->info()
                    ->body("Developer {$developer->name} has finalized the deletion of approved project '{$projectName}' [{$projectCode}].")
                    ->sendToDatabase($approvedByAdmin);
            }
        } catch (\Throwable $e) {
            Log::error('PortalNotificationService::notifyApprovedProjectDeleted error: ' . $e->getMessage());
        }
    }

    /**
     * 2. When admin directly deletes a project -> notify project creator developer
     */
    public static function notifyDirectProjectDeletedByAdmin(string $projectName, string $projectCode, ?User $creator, User $admin): void
    {
        if (! $creator || $creator->id === $admin->id) {
            return;
        }

        try {
            Notification::make()
                ->title('Project Deleted by Administrator')
                ->icon('heroicon-o-trash')
                ->danger()
                ->body("Administrator {$admin->name} deleted your project '{$projectName}' [{$projectCode}].")
                ->sendToDatabase($creator);
        } catch (\Throwable $e) {
            Log::error('PortalNotificationService::notifyDirectProjectDeletedByAdmin error: ' . $e->getMessage());
        }
    }

    /**
     * 3. When an admin adds a user -> notify admin, superadmin, developer, qa roles
     */
    public static function notifyUserAdded(User $newUser, ?User $actor = null): void
    {
        try {
            $actorName = $actor ? $actor->name : 'An Administrator';
            $roleLabel = match ($newUser->role) {
                'superadmin' => 'Super Admin',
                'admin' => 'Administrator',
                'developer' => 'Developer',
                'qa' => 'QA Engineer',
                default => ucfirst($newUser->role),
            };

            // Notify all other users across all roles
            $recipients = User::where('id', '!=', $newUser->id)->get();

            foreach ($recipients as $recipient) {
                Notification::make()
                    ->title('New Team Member Added')
                    ->icon('heroicon-o-user-plus')
                    ->info()
                    ->body("{$actorName} added {$newUser->name} ({$newUser->email}) to the team as {$roleLabel}.")
                    ->sendToDatabase($recipient);
            }
        } catch (\Throwable $e) {
            Log::error('PortalNotificationService::notifyUserAdded error: ' . $e->getMessage());
        }
    }

    /**
     * 4. When an admin deletes a user -> notify admin, superadmin, developer, qa roles
     */
    public static function notifyUserDeleted(string $deletedUserName, string $deletedUserRole, ?User $actor = null): void
    {
        try {
            $actorName = $actor ? $actor->name : 'An Administrator';
            $roleLabel = match ($deletedUserRole) {
                'superadmin' => 'Super Admin',
                'admin' => 'Administrator',
                'developer' => 'Developer',
                'qa' => 'QA Engineer',
                default => ucfirst($deletedUserRole),
            };

            // Notify all remaining users across all roles
            $recipients = User::all();

            foreach ($recipients as $recipient) {
                Notification::make()
                    ->title('User Removed')
                    ->icon('heroicon-o-user-minus')
                    ->warning()
                    ->body("{$actorName} removed {$deletedUserName} ({$roleLabel}) from the team.")
                    ->sendToDatabase($recipient);
            }
        } catch (\Throwable $e) {
            Log::error('PortalNotificationService::notifyUserDeleted error: ' . $e->getMessage());
        }
    }

    /**
     * 5. When a developer creates a project -> notify admin, superadmin, and assigned users
     */
    public static function notifyProjectCreated(Project $project, User $creator, array $assignedUserIds = []): void
    {
        try {
            // Fetch all admins and superadmins (excluding creator if creator is somehow admin)
            $adminUsers = User::whereIn('role', ['admin', 'superadmin'])
                ->where('id', '!=', $creator->id)
                ->get();

            // Fetch assigned users excluding the creator
            $assignedUsers = collect();
            if (!empty($assignedUserIds)) {
                $assignedUsers = User::whereIn('id', $assignedUserIds)
                    ->where('id', '!=', $creator->id)
                    ->get();
            }

            // Merge recipients uniquely
            $recipients = $adminUsers->merge($assignedUsers)->unique('id');

            foreach ($recipients as $recipient) {
                $isAdmin = in_array($recipient->role, ['admin', 'superadmin']);
                $url = $isAdmin
                    ? "/admin/projects?search=" . urlencode($project->code)
                    : "/projects/{$project->id}";

                Notification::make()
                    ->title('New Project Created')
                    ->icon('heroicon-o-folder-plus')
                    ->success()
                    ->body("Developer {$creator->name} created project '{$project->name}' ({$project->code}).")
                    ->actions([
                        Action::make('view_project')
                            ->button()
                            ->label('View Project')
                            ->url($url),
                    ])
                    ->sendToDatabase($recipient);
            }
        } catch (\Throwable $e) {
            Log::error('PortalNotificationService::notifyProjectCreated error: ' . $e->getMessage());
        }
    }

    /**
     * When a developer is assigned to a project -> notify them
     */
    public static function notifyDeveloperAssigned(Project $project, User $assignedUser, User $actor): void
    {
        if ($assignedUser->id === $actor->id) {
            return;
        }

        try {
            Notification::make()
                ->title('Assigned to Project')
                ->icon('heroicon-o-user-group')
                ->info()
                ->body("You have been assigned to project '{$project->name}' ({$project->code}) by {$actor->name}.")
                ->actions([
                    Action::make('view_project')
                        ->button()
                        ->label('View Project')
                        ->url("/projects/{$project->id}"),
                ])
                ->sendToDatabase($assignedUser);
        } catch (\Throwable $e) {
            Log::error('PortalNotificationService::notifyDeveloperAssigned error: ' . $e->getMessage());
        }
    }
}
