<?php

namespace App\Filament\Resources\AuditLogs\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class AuditLogInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('created_at')->dateTime(),
                TextEntry::make('user.name')->label('Actor'),
                TextEntry::make('project.name')->label('Project'),
                TextEntry::make('action_type')->badge(),
                TextEntry::make('target_field')->label('Target Resource / Secret')->columnSpanFull(),
                TextEntry::make('ip_address')->label('Client IP'),
            ]);
    }
}
