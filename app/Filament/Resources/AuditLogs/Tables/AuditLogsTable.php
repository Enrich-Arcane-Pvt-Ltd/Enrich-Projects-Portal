<?php

namespace App\Filament\Resources\AuditLogs\Tables;

use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class AuditLogsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('created_at')
                    ->label('Timestamp')
                    ->dateTime('Y-m-d H:i:s')
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('user.name')
                    ->label('User / Actor')
                    ->searchable()
                    ->badge()
                    ->color('gray'),
                TextColumn::make('project.name')
                    ->label('Project')
                    ->searchable()
                    ->description(fn ($record) => $record->project?->code),
                TextColumn::make('action_type')
                    ->label('Action')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'VIEWED_SECRET' => 'warning',
                        'COPIED_KEY' => 'danger',
                        'EXPORTED_ENV' => 'danger',
                        'DOWNLOADED_DOC' => 'info',
                        default => 'gray',
                    }),
                TextColumn::make('target_field')
                    ->label('Target Secret / Resource')
                    ->searchable()
                    ->weight('medium'),
                TextColumn::make('ip_address')
                    ->label('IP Address')
                    ->badge()
                    ->color('gray'),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('action_type')
                    ->options([
                        'VIEWED_SECRET' => 'Viewed Secret',
                        'COPIED_KEY' => 'Copied Key',
                        'EXPORTED_ENV' => 'Exported .env',
                        'DOWNLOADED_DOC' => 'Downloaded Document',
                    ]),
            ])
            ->recordActions([
                ViewAction::make(),
            ]);
    }
}
