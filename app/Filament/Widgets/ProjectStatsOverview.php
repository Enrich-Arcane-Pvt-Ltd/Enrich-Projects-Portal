<?php

namespace App\Filament\Widgets;

use App\Models\AuditLog;
use App\Models\Project;
use App\Models\ProjectCredential;
use App\Models\ServerEnvironment;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class ProjectStatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        return [
            Stat::make('Total Projects', Project::count())
                ->description(Project::where('status', 'in_progress')->count() . ' actively in development')
                ->descriptionIcon('heroicon-m-folder')
                ->color('primary'),

            Stat::make('Secured Secrets', ProjectCredential::count())
                ->description('Encrypted via AES-256-CBC')
                ->descriptionIcon('heroicon-m-key')
                ->color('warning'),

            Stat::make('Server Environments', ServerEnvironment::count())
                ->description(ServerEnvironment::where('environment_type', 'production')->count() . ' live production nodes')
                ->descriptionIcon('heroicon-m-server')
                ->color('success'),

            Stat::make('Audit Trail Events', AuditLog::count())
                ->description('Total tracked secret accesses')
                ->descriptionIcon('heroicon-m-shield-check')
                ->color('danger'),
        ];
    }
}
