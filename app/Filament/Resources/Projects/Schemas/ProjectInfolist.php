<?php

namespace App\Filament\Resources\Projects\Schemas;

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
                    ->formatStateUsing(fn (?string $state): string => match ($state) {
                        'web_app' => 'Web App',
                        'mobile_app' => 'Mobile App',
                        'iot_embedded' => 'IOT Embedded',
                        'api_service' => 'Api Service',
                        'hybrid' => 'Hybrid',
                        default => $state ?? '',
                    })
                    ->color(fn (?string $state): string => match ($state) {
                        'web_app' => 'info',
                        'mobile_app' => 'success',
                        'iot_embedded' => 'warning',
                        'api_service' => 'danger',
                        'hybrid' => 'primary',
                        default => 'gray',
                    }),
                TextEntry::make('status')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => match ($state) {
                        'in_progress' => 'In Progress',
                        'planning' => 'Planning',
                        'maintenance' => 'Maintenance',
                        'completed' => 'Completed',
                        'archived' => 'Archived',
                        default => $state ?? '',
                    })
                    ->color(fn (?string $state): string => match ($state) {
                        'in_progress' => 'success',
                        'planning' => 'info',
                        'maintenance' => 'warning',
                        'completed' => 'primary',
                        'archived' => 'gray',
                        default => 'gray',
                    }),
                TextEntry::make('priority')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => match ($state) {
                        'critical' => 'Critical',
                        'high' => 'High',
                        'medium' => 'Medium',
                        'low' => 'Low',
                        default => $state ?? '',
                    })
                    ->color(fn (?string $state): string => match ($state) {
                        'critical' => 'danger',
                        'high' => 'warning',
                        'medium' => 'info',
                        'low' => 'gray',
                        default => 'gray',
                    }),
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
