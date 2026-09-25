<?php

namespace App\Filament\Resources\Projects\Tables;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
use App\Services\AuditService;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ProjectsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('Project')
                    ->weight('bold')
                    ->searchable()
                    ->sortable()
                    ->description(function ($record) {
                        $desc = $record->code;
                        if ($record->deletion_status === 'pending') {
                            $desc .= ' • [Deletion Approval Requested]';
                        } elseif ($record->deletion_status === 'approved') {
                            $desc .= ' • [Deletion Approved]';
                        }
                        return $desc;
                    }),
                TextColumn::make('type')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => ProjectType::tryFrom($state ?? '')?->label() ?? ($state ?? ''))
                    ->color(fn (?string $state): string => ProjectType::tryFrom($state ?? '')?->color() ?? 'gray'),
                TextColumn::make('status')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => ProjectStatus::tryFrom($state ?? '')?->label() ?? ($state ?? ''))
                    ->color(fn (?string $state): string => ProjectStatus::tryFrom($state ?? '')?->color() ?? 'gray'),
                TextColumn::make('priority')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => ProjectPriority::tryFrom($state ?? '')?->label() ?? ($state ?? ''))
                    ->color(fn (?string $state): string => ProjectPriority::tryFrom($state ?? '')?->color() ?? 'gray'),
                TextColumn::make('leadDeveloper.name')
                    ->label('Lead Dev')
                    ->searchable(),
                TextColumn::make('tech_stack')
                    ->label('Stack')
                    ->limit(25)
                    ->searchable(),
                TextColumn::make('credentials_count')
                    ->counts('credentials')
                    ->label('Secrets')
                    ->badge()
                    ->color('warning'),
                TextColumn::make('deletion_status')
                    ->label('Deletion')
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
                        default => 'None',
                    })
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->label('Last Updated')
                    ->dateTime('M d, Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('type')
                    ->options(ProjectType::options()),
                SelectFilter::make('status')
                    ->options(ProjectStatus::options()),
                SelectFilter::make('priority')
                    ->options(ProjectPriority::options()),
                SelectFilter::make('deletion_status')
                    ->label('Deletion Request')
                    ->options([
                        'pending' => 'Pending Approval',
                        'approved' => 'Approved',
                        'rejected' => 'Rejected',
                    ]),
            ])
            ->recordActions([
                ViewAction::make(),
                Action::make('approve_deletion')
                    ->label('Approve Deletion')
                    ->icon('heroicon-o-check-circle')
                    ->color('warning')
                    ->visible(fn ($record) => $record->deletion_status === 'pending')
                    ->requiresConfirmation()
                    ->modalHeading('Approve Project Deletion Request')
                    ->modalDescription(fn ($record) => "Developer " . ($record->creator?->name ?? 'User') . " requested approval to delete '{$record->name}' ({$record->code}). Reason: " . ($record->deletion_reason ?: 'No reason provided') . ". Do you approve this deletion?")
                    ->modalSubmitActionLabel('Yes, Approve Deletion')
                    ->action(function ($record) {
                        $record->update([
                            'deletion_status' => 'approved',
                            'deletion_approved_at' => now(),
                            'deletion_approved_by_id' => auth()->id(),
                        ]);

                        AuditService::log(
                            $record->id,
                            'APPROVED_PROJECT_DELETION',
                            "Admin " . (auth()->user()?->name ?? 'Admin') . " approved deletion request for project {$record->name}"
                        );

                        Notification::make()
                            ->title('Project Deletion Approved')
                            ->success()
                            ->body("Deletion for '{$record->name}' has been approved. The developer can now delete this project.")
                            ->send();
                    }),
                Action::make('reject_deletion')
                    ->label('Reject Deletion')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->visible(fn ($record) => $record->deletion_status === 'pending')
                    ->form([
                        Textarea::make('rejection_reason')
                            ->label('Rejection Reason')
                            ->placeholder('Specify why deletion approval is rejected...')
                            ->required(),
                    ])
                    ->modalHeading('Reject Project Deletion Request')
                    ->modalSubmitActionLabel('Reject Request')
                    ->action(function ($record, array $data) {
                        $record->update([
                            'deletion_status' => 'rejected',
                            'deletion_rejected_at' => now(),
                            'deletion_rejection_reason' => $data['rejection_reason'],
                        ]);

                        AuditService::log(
                            $record->id,
                            'REJECTED_PROJECT_DELETION',
                            "Admin " . (auth()->user()?->name ?? 'Admin') . " rejected deletion request for project {$record->name}: {$data['rejection_reason']}"
                        );

                        Notification::make()
                            ->title('Deletion Request Rejected')
                            ->warning()
                            ->body("Deletion request for '{$record->name}' has been rejected.")
                            ->send();
                    }),
                DeleteAction::make()
                    ->modalHeading('Delete Project')
                    ->modalDescription('Do u really want to Delete this project?')
                    ->modalSubmitActionLabel('Yes, Delete')
                    ->before(function ($record) {
                        AuditService::log(
                            null,
                            'DELETED_PROJECT',
                            "Admin " . (auth()->user()?->name ?? 'Admin') . " deleted project {$record->name} [{$record->code}]"
                        );
                    }),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    // DeleteBulkAction::make(),
                ]),
            ]);
    }
}
