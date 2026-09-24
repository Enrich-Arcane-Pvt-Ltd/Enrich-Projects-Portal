<?php

namespace App\Filament\Resources\Projects\Tables;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
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
            ])
            ->recordActions([
                ViewAction::make(),
                // EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    // DeleteBulkAction::make(),
                ]),
            ]);
    }
}
