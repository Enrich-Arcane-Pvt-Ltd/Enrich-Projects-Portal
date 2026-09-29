<?php

namespace App\Filament\Resources\Projects\RelationManagers;

use App\Models\ProjectAccessRequest;
use App\Services\AuditService;
use App\Services\PortalNotificationService;
use Filament\Actions\Action;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;

class AccessRequestsRelationManager extends RelationManager
{
    protected static string $relationship = 'accessRequests';

    protected static ?string $title = 'Access Requests';

    protected static string | \BackedEnum | null $icon = 'heroicon-o-key';

    public static function getBadge(Model $ownerRecord, string $pageClass): ?string
    {
        $pendingCount = $ownerRecord->accessRequests()->where('status', 'pending')->count();
        return $pendingCount > 0 ? (string) $pendingCount : null;
    }

    public function form(Schema $schema): Schema
    {
        return $schema->components([]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('reason')
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('user.name')
                    ->label('Developer')
                    ->weight('bold')
                    ->searchable()
                    ->description(fn ($record) => $record->user?->email),
                TextColumn::make('admin.name')
                    ->label('Requested To')
                    ->searchable(),
                TextColumn::make('reason')
                    ->label('Reason / Justification')
                    ->wrap()
                    ->placeholder('No justification provided'),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->color(fn (?string $state): string => match ($state) {
                        'pending' => 'warning',
                        'approved' => 'success',
                        'rejected' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (?string $state): string => match ($state) {
                        'pending' => 'Pending Approval',
                        'approved' => 'Approved',
                        'rejected' => 'Rejected',
                        default => ucfirst($state ?? ''),
                    }),
                TextColumn::make('requested_at')
                    ->label('Requested At')
                    ->dateTime('M d, Y H:i')
                    ->sortable(),
                TextColumn::make('approvedBy.name')
                    ->label('Reviewed By')
                    ->placeholder('-'),
                TextColumn::make('approved_at')
                    ->label('Reviewed At')
                    ->dateTime('M d, Y H:i')
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('rejection_reason')
                    ->label('Rejection Note')
                    ->wrap()
                    ->placeholder('-')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->recordActions([
                Action::make('approve')
                    ->label('Approve')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn ($record) => $record->status === 'pending')
                    ->requiresConfirmation()
                    ->modalHeading('Approve Project Access')
                    ->modalDescription(fn ($record) => "Are you sure you want to grant {$record->user?->name} access to open this project vault?")
                    ->modalSubmitActionLabel('Grant Access')
                    ->action(function ($record) {
                        $record->update([
                            'status' => 'approved',
                            'approved_at' => now(),
                            'approved_by_id' => auth()->id(),
                        ]);

                        AuditService::log(
                            $record->project_id,
                            'APPROVED_PROJECT_ACCESS',
                            "Admin " . (auth()->user()?->name ?? 'Admin') . " approved project access for developer " . ($record->user?->name ?? 'Developer')
                        );

                        if ($record->user) {
                            PortalNotificationService::notifyProjectAccessApproved(
                                $record->project,
                                auth()->user(),
                                $record->user
                            );
                        }

                        Notification::make()
                            ->title('Project Access Granted')
                            ->success()
                            ->body("Developer {$record->user?->name} can now access this project vault.")
                            ->send();
                    }),
                Action::make('reject')
                    ->label('Reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->visible(fn ($record) => $record->status === 'pending')
                    ->form([
                        Textarea::make('rejection_reason')
                            ->label('Reason for Rejection')
                            ->placeholder('Specify why access to this project is denied...')
                            ->required(),
                    ])
                    ->modalHeading('Reject Project Access Request')
                    ->modalSubmitActionLabel('Reject Request')
                    ->action(function ($record, array $data) {
                        $record->update([
                            'status' => 'rejected',
                            'rejected_at' => now(),
                            'rejection_reason' => $data['rejection_reason'],
                        ]);

                        AuditService::log(
                            $record->project_id,
                            'REJECTED_PROJECT_ACCESS',
                            "Admin " . (auth()->user()?->name ?? 'Admin') . " rejected access for developer " . ($record->user?->name ?? 'Developer') . ": {$data['rejection_reason']}"
                        );

                        if ($record->user) {
                            PortalNotificationService::notifyProjectAccessRejected(
                                $record->project,
                                auth()->user(),
                                $record->user,
                                $data['rejection_reason']
                            );
                        }

                        Notification::make()
                            ->title('Access Request Rejected')
                            ->warning()
                            ->body("Access request for developer {$record->user?->name} has been rejected.")
                            ->send();
                    }),
                Action::make('revoke')
                    ->label('Revoke')
                    ->icon('heroicon-o-no-symbol')
                    ->color('warning')
                    ->visible(fn ($record) => $record->status === 'approved')
                    ->requiresConfirmation()
                    ->modalHeading('Revoke Project Access')
                    ->modalDescription(fn ($record) => "Revoke project access for developer {$record->user?->name}? They will no longer be able to open this project vault.")
                    ->modalSubmitActionLabel('Revoke Access')
                    ->action(function ($record) {
                        $record->update([
                            'status' => 'rejected',
                            'rejected_at' => now(),
                            'rejection_reason' => 'Access revoked by administrator.',
                        ]);

                        AuditService::log(
                            $record->project_id,
                            'REVOKED_PROJECT_ACCESS',
                            "Admin " . (auth()->user()?->name ?? 'Admin') . " revoked project access for developer " . ($record->user?->name ?? 'Developer')
                        );

                        Notification::make()
                            ->title('Access Revoked')
                            ->warning()
                            ->body("Developer {$record->user?->name} no longer has access to this project.")
                            ->send();
                    }),
            ]);
    }
}
