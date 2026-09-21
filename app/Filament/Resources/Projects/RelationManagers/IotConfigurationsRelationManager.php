<?php

namespace App\Filament\Resources\Projects\RelationManagers;

use App\Models\IotConfiguration;
use App\Services\AuditService;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class IotConfigurationsRelationManager extends RelationManager
{
    protected static string $relationship = 'iotConfigurations';

    protected static ?string $title = 'IoT Hardware & Telemetry';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('hardware_model')
                    ->label('Hardware Model / Microcontroller')
                    ->placeholder('e.g. ESP32 WROOM-32, SIM800L GPS, RFID RC522')
                    ->required(),
                TextInput::make('firmware_version')
                    ->label('Firmware Version')
                    ->placeholder('e.g. v1.4.2-prod'),
                Select::make('communication_protocol')
                    ->options([
                        'MQTT' => 'MQTT / MQTTS (Broker)',
                        'HTTP_REST' => 'HTTP / REST Endpoints',
                        'WebSockets' => 'WebSockets Direct',
                    ])
                    ->default('MQTT')
                    ->required(),
                TextInput::make('broker_url')
                    ->label('Broker / Host URL')
                    ->placeholder('mqtt.example.com'),
                TextInput::make('port')
                    ->label('Port')
                    ->placeholder('8883 (TLS)'),
                TextInput::make('topic_structure')
                    ->label('MQTT Topic / Payload Pattern')
                    ->placeholder('school/bus/{bus_id}/attendance')
                    ->columnSpanFull(),
                Textarea::make('auth_token_or_certs')
                    ->label('Device Authentication Token / SSL Cert (Encrypted at Rest)')
                    ->password()
                    ->revealable()
                    ->rows(3)
                    ->columnSpanFull(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('hardware_model')
            ->columns([
                TextColumn::make('hardware_model')
                    ->weight('bold')
                    ->searchable(),
                TextColumn::make('firmware_version')
                    ->badge()
                    ->color('gray'),
                TextColumn::make('communication_protocol')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'MQTT' => 'success',
                        'HTTP_REST' => 'info',
                        'WebSockets' => 'warning',
                        default => 'gray',
                    }),
                TextColumn::make('broker_url')
                    ->formatStateUsing(fn ($state, $record) => $state ? "{$state}:{$record->port}" : '-'),
                TextColumn::make('topic_structure')
                    ->limit(35),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                Action::make('view_iot_auth')
                    ->label('Device Token')
                    ->icon('heroicon-o-cpu-chip')
                    ->color('info')
                    ->action(function (IotConfiguration $record) {
                        AuditService::log($record->project_id, 'VIEWED_SECRET', "IoT Device: {$record->hardware_model} ({$record->communication_protocol})");
                    })
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close')
                    ->infolist([
                        TextEntry::make('hardware_model')->weight('bold'),
                        TextEntry::make('firmware_version')->badge(),
                        TextEntry::make('broker_url'),
                        TextEntry::make('port'),
                        TextEntry::make('topic_structure')->columnSpanFull(),
                        TextEntry::make('auth_token_or_certs')
                            ->label('Decrypted Device Token / Cert')
                            ->copyable()
                            ->copyMessage('Token copied to clipboard')
                            ->columnSpanFull(),
                    ]),
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
