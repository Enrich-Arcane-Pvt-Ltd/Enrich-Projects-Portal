<?php

namespace App\Filament\Resources\Projects\Schemas;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ProjectInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(1)
            ->components([
                Section::make('Project Overview')
                    ->description('Essential metadata, architecture specifications, and lead assignment')
                    ->collapsible()
                    ->columnSpanFull()
                    ->schema([
                        Grid::make(['default' => 1, 'sm' => 2, 'md' => 3, 'lg' => 3])
                            ->schema([
                                TextEntry::make('name')
                                    ->label('Project Name')
                                    ->weight('bold')
                                    ->size('lg'),

                                TextEntry::make('code')
                                    ->label('Project Code')
                                    ->fontFamily('mono')
                                    ->copyable()
                                    ->copyMessage('Project code copied'),

                                TextEntry::make('status')
                                    ->label('Status')
                                    ->badge()
                                    ->formatStateUsing(fn (?string $state): string => ProjectStatus::tryFrom($state ?? '')?->label() ?? ($state ?? ''))
                                    ->color(fn (?string $state): string => ProjectStatus::tryFrom($state ?? '')?->color() ?? 'gray'),

                                TextEntry::make('priority')
                                    ->label('Priority')
                                    ->badge()
                                    ->formatStateUsing(fn (?string $state): string => ProjectPriority::tryFrom($state ?? '')?->label() ?? ($state ?? ''))
                                    ->color(fn (?string $state): string => ProjectPriority::tryFrom($state ?? '')?->color() ?? 'gray'),

                                TextEntry::make('type')
                                    ->label('Project Type')
                                    ->badge()
                                    ->formatStateUsing(fn (?string $state): string => ProjectType::tryFrom($state ?? '')?->label() ?? ($state ?? ''))
                                    ->color(fn (?string $state): string => ProjectType::tryFrom($state ?? '')?->color() ?? 'gray'),

                                TextEntry::make('leadDeveloper.name')
                                    ->label('Lead Developer')
                                    ->placeholder('Unassigned'),

                                TextEntry::make('manager.name')
                                    ->label('Project Manager')
                                    ->placeholder('Unassigned'),

                                TextEntry::make('created_at')
                                    ->label('Created On')
                                    ->dateTime()
                                    ->placeholder('-'),

                                TextEntry::make('updated_at')
                                    ->label('Last Updated')
                                    ->dateTime()
                                    ->placeholder('-'),
                            ]),

                        Grid::make(1)
                            ->schema([
                                TextEntry::make('tech_stack')
                                    ->label('Technology Stack')
                                    ->placeholder('None specified')
                                    ->columnSpanFull(),

                                TextEntry::make('description')
                                    ->label('Architecture Overview & Scope')
                                    ->placeholder('No description provided.')
                                    ->columnSpanFull(),
                            ]),
                    ]),
            ]);
    }
}
