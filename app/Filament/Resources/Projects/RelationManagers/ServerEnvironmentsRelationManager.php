<?php

namespace App\Filament\Resources\Projects\RelationManagers;

use App\Models\ServerEnvironment;
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

class ServerEnvironmentsRelationManager extends RelationManager
{
    protected static string $relationship = 'serverEnvironments';

    protected static ?string $title = 'Server & Hosting Environments';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('environment_type')
                    ->options([
                        'development' => 'Development / Local',
                        'staging' => 'Staging / QA',
                        'production' => 'Production',
                    ])
                    ->default('production')
                    ->required(),
                TextInput::make('hosting_provider')
                    ->label('Hosting Provider / Spec')
                    ->placeholder('e.g. AWS EC2 t4g.medium / Hetzner VPS')
                    ->required(),
                TextInput::make('ip_address')
                    ->label('IP Address')
                    ->placeholder('e.g. 54.210.88.19'),
                TextInput::make('hostname')
                    ->label('Domain / Hostname')
                    ->placeholder('e.g. api.schoolpickup.app'),
                TextInput::make('ssh_port')
                    ->numeric()
                    ->default(22)
                    ->required(),
                TextInput::make('ssh_user')
                    ->default('ubuntu')
                    ->required(),
                TextInput::make('runtime_stack')
                    ->label('Runtime Stack')
                    ->placeholder('e.g. PHP 8.3-FPM, Node 20, Nginx, MySQL 8.0')
                    ->columnSpanFull(),
                TextInput::make('deploy_path')
                    ->label('Deployment Path')
                    ->placeholder('e.g. /var/www/school-taxi-api')
                    ->columnSpanFull(),
                Textarea::make('ssh_credential')
                    ->label('SSH Private Key / Password (Encrypted at Rest)')
                    ->password()
                    ->revealable()
                    ->rows(4)
                    ->columnSpanFull(),
                Textarea::make('env_backup')
                    ->label('.env Backup (Encrypted at Rest)')
                    ->rows(6)
                    ->columnSpanFull(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('hosting_provider')
            ->columns([
                TextColumn::make('environment_type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'production' => 'danger',
                        'staging' => 'warning',
                        'development' => 'gray',
                        default => 'gray',
                    }),
                TextColumn::make('hosting_provider')
                    ->weight('bold')
                    ->searchable(),
                TextColumn::make('ip_address')
                    ->copyable(),
                TextColumn::make('hostname')
                    ->searchable(),
                TextColumn::make('ssh_user')
                    ->formatStateUsing(fn ($state, $record) => "{$state}@{$record->ip_address}:{$record->ssh_port}"),
                TextColumn::make('deploy_path')
                    ->limit(25),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                Action::make('inspect_server')
                    ->label('View Specs & SSH')
                    ->icon('heroicon-o-server')
                    ->color('info')
                    ->action(function (ServerEnvironment $record) {
                        AuditService::log($record->project_id, 'VIEWED_SECRET', "Server Environment Specs: {$record->environment_type} ({$record->hosting_provider})");
                    })
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close')
                    ->infolist([
                        TextEntry::make('hosting_provider')->weight('bold'),
                        TextEntry::make('environment_type')->badge(),
                        TextEntry::make('ip_address')->copyable(),
                        TextEntry::make('hostname'),
                        TextEntry::make('ssh_user'),
                        TextEntry::make('runtime_stack'),
                        TextEntry::make('deploy_path'),
                        TextEntry::make('ssh_credential')
                            ->label('SSH Key / Credential')
                            ->copyable()
                            ->copyMessage('SSH credential copied')
                            ->columnSpanFull(),
                        TextEntry::make('env_backup')
                            ->label('Active .env Backup')
                            ->copyable()
                            ->copyMessage('.env copied')
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
