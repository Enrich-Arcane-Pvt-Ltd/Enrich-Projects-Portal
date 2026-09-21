<?php

namespace App\Filament\Resources\Projects\RelationManagers;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class BackgroundServicesRelationManager extends RelationManager
{
    protected static string $relationship = 'backgroundServices';

    protected static ?string $title = 'Background Daemons & Workers';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('service_type')
                    ->options([
                        'cron_schedule' => 'Cron Schedule (artisan schedule)',
                        'queue_worker' => 'Queue Worker (artisan queue:work)',
                        'supervisor_daemon' => 'Supervisor / Systemd Daemon',
                        'websocket' => 'WebSocket Server (Reverb / Soketi)',
                    ])
                    ->default('cron_schedule')
                    ->required(),
                TextInput::make('command')
                    ->label('Execution Command')
                    ->placeholder('e.g. php artisan schedule:run')
                    ->required()
                    ->columnSpanFull(),
                TextInput::make('frequency_or_config')
                    ->label('Cron Frequency / Daemon Settings')
                    ->placeholder('e.g. * * * * * or numprocs=4, autostart=true')
                    ->columnSpanFull(),
                Textarea::make('monitoring_notes')
                    ->label('Supervisor Conf & Monitoring Notes')
                    ->rows(3)
                    ->columnSpanFull(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('command')
            ->columns([
                TextColumn::make('service_type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'cron_schedule' => 'info',
                        'queue_worker' => 'success',
                        'supervisor_daemon' => 'warning',
                        'websocket' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('command')
                    ->weight('bold')
                    ->searchable()
                    ->copyable(),
                TextColumn::make('frequency_or_config')
                    ->label('Schedule / Config'),
                TextColumn::make('monitoring_notes')
                    ->limit(40),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
