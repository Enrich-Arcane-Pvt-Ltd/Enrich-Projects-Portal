<?php

namespace App\Filament\Resources\Projects\Schemas;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class ProjectInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('name'),
                TextEntry::make('code'),
                TextEntry::make('type')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => ProjectType::tryFrom($state ?? '')?->label() ?? ($state ?? ''))
                    ->color(fn (?string $state): string => ProjectType::tryFrom($state ?? '')?->color() ?? 'gray'),
                TextEntry::make('status')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => ProjectStatus::tryFrom($state ?? '')?->label() ?? ($state ?? ''))
                    ->color(fn (?string $state): string => ProjectStatus::tryFrom($state ?? '')?->color() ?? 'gray'),
                TextEntry::make('priority')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => ProjectPriority::tryFrom($state ?? '')?->label() ?? ($state ?? ''))
                    ->color(fn (?string $state): string => ProjectPriority::tryFrom($state ?? '')?->color() ?? 'gray'),
                TextEntry::make('leadDeveloper.name')
                    ->label('Lead developer')
                    ->placeholder('-'),
                TextEntry::make('manager.name')
                    ->label('Manager')
                    ->placeholder('-'),
                TextEntry::make('tech_stack')
                    ->placeholder('-'),
                TextEntry::make('description')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('created_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('updated_at')
                    ->dateTime()
                    ->placeholder('-'),
            ]);
    }
}
