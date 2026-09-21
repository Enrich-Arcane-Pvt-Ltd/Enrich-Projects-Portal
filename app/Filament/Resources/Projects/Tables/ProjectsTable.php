<?php

namespace App\Filament\Resources\Projects\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
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
                    ->description(fn ($record) => $record->code),
                TextColumn::make('type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'web_app' => 'info',
                        'mobile_app' => 'success',
                        'iot_embedded' => 'warning',
                        'api_service' => 'danger',
                        'hybrid' => 'primary',
                        default => 'gray',
                    }),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'in_progress' => 'success',
                        'planning' => 'info',
                        'maintenance' => 'warning',
                        'completed' => 'primary',
                        'archived' => 'gray',
                        default => 'gray',
                    }),
                TextColumn::make('priority')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'critical' => 'danger',
                        'high' => 'warning',
                        'medium' => 'info',
                        'low' => 'gray',
                        default => 'gray',
                    }),
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
                TextColumn::make('updated_at')
                    ->label('Last Updated')
                    ->dateTime('M d, Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('type')
                    ->options([
                        'web_app' => 'Web App',
                        'mobile_app' => 'Mobile App',
                        'iot_embedded' => 'IoT / Embedded',
                        'api_service' => 'API Service',
                        'hybrid' => 'Hybrid',
                    ]),
                SelectFilter::make('status')
                    ->options([
                        'planning' => 'Planning',
                        'in_progress' => 'In Progress',
                        'maintenance' => 'Maintenance',
                        'completed' => 'Completed',
                        'archived' => 'Archived',
                    ]),
                SelectFilter::make('priority')
                    ->options([
                        'low' => 'Low',
                        'medium' => 'Medium',
                        'high' => 'High',
                        'critical' => 'Critical',
                    ]),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
