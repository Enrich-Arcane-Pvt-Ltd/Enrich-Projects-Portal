<?php

namespace App\Filament\Resources\Projects\RelationManagers;

use App\Models\ClientAccessCredential;
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

class ClientAccessCredentialsRelationManager extends RelationManager
{
    protected static string $relationship = 'clientAccessCredentials';

    protected static ?string $title = 'Client Access Credentials';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('username')
                    ->label('Client Username / ID')
                    ->placeholder('e.g. client_admin, johndoe')
                    ->required(),
                TextInput::make('email')
                    ->label('Client Email Address')
                    ->email()
                    ->placeholder('e.g. client@company.com'),
                TextInput::make('password')
                    ->label('Client Password (Encrypted at Rest)')
                    ->password()
                    ->revealable()
                    ->required(),
                TextInput::make('role')
                    ->label('Account Role / Access Level')
                    ->placeholder('e.g. Super Admin, Store Manager, Client Owner'),
                TextInput::make('login_url')
                    ->label('Application Login URL')
                    ->url()
                    ->placeholder('https://portal.clientdomain.com/login'),
                Select::make('environment')
                    ->options([
                        'local' => 'Local / Dev',
                        'staging' => 'Staging / QA',
                        'production' => 'Production',
                    ])
                    ->default('production')
                    ->required(),
                Textarea::make('notes')
                    ->label('2FA Details, PINs & Access Instructions')
                    ->rows(3)
                    ->columnSpanFull(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('username')
            ->columns([
                TextColumn::make('username')
                    ->label('Username')
                    ->weight('bold')
                    ->searchable()
                    ->copyable(),
                TextColumn::make('email')
                    ->label('Email')
                    ->searchable()
                    ->copyable()
                    ->default('-'),
                TextColumn::make('role')
                    ->label('Role')
                    ->badge()
                    ->color('info')
                    ->default('-'),
                TextColumn::make('environment')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'production' => 'danger',
                        'staging' => 'warning',
                        'local' => 'gray',
                        default => 'gray',
                    }),
                TextColumn::make('login_url')
                    ->label('Login Portal')
                    ->url(fn ($record) => $record->login_url, true)
                    ->color('primary')
                    ->limit(28)
                    ->default('-'),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                Action::make('view_credentials')
                    ->label('View Login & Password')
                    ->icon('heroicon-o-lock-closed')
                    ->color('warning')
                    ->modalHeading(fn (ClientAccessCredential $record) => "Client Access: {$record->username}")
                    ->modalDescription('Viewing or copying this client password is automatically logged in the audit trail.')
                    ->action(function (ClientAccessCredential $record) {
                        $desc = "Client Credential: {$record->username}" . ($record->email ? " ({$record->email})" : "");
                        AuditService::log($record->project_id, 'VIEWED_SECRET', $desc);
                    })
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close')
                    ->infolist([
                        TextEntry::make('username')
                            ->label('Username')
                            ->weight('bold')
                            ->copyable(),
                        TextEntry::make('email')
                            ->label('Email Address')
                            ->copyable(),
                        TextEntry::make('role')
                            ->label('Account Role')
                            ->badge(),
                        TextEntry::make('environment')
                            ->badge(),
                        TextEntry::make('password')
                            ->label('Decrypted Password')
                            ->copyable()
                            ->copyMessage('Client password copied to clipboard')
                            ->columnSpanFull(),
                        TextEntry::make('login_url')
                            ->label('Application Login URL')
                            ->url(fn ($record) => $record->login_url, true)
                            ->columnSpanFull(),
                        TextEntry::make('notes')
                            ->label('Access Notes & Instructions')
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
