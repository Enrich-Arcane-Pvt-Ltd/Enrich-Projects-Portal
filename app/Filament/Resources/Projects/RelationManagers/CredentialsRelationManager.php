<?php

namespace App\Filament\Resources\Projects\RelationManagers;

use App\Models\ProjectCredential;
use App\Services\AuditService;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class CredentialsRelationManager extends RelationManager
{
    protected static string $relationship = 'credentials';

    protected static ?string $title = 'Credentials Vault';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('category')
                    ->options([
                        'api_key' => 'API Key',
                        'webhook_secret' => 'Webhook Secret',
                        'oauth_token' => 'OAuth Bearer Token',
                        'ssh_key' => 'SSH Key',
                        'db_password' => 'Database Password',
                    ])
                    ->default('api_key')
                    ->required(),
                TextInput::make('key_name')
                    ->label('Credential Identifier')
                    ->placeholder('e.g. GOOGLE_MAPS_KEY')
                    ->required(),
                Select::make('environment')
                    ->options([
                        'local' => 'Local / Dev',
                        'staging' => 'Staging / QA',
                        'production' => 'Production',
                    ])
                    ->default('production')
                    ->required(),
                TextInput::make('key_value')
                    ->label('Secret Value')
                    ->password()
                    ->revealable()
                    ->required()
                    ->columnSpanFull(),
            ]);
    }

    public function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('key_name')->weight('bold'),
                TextEntry::make('category')->badge(),
                TextEntry::make('environment')->badge(),
                TextEntry::make('key_value')
                    ->label('Decrypted Secret')
                    ->copyable()
                    ->copyMessage('Secret copied to clipboard')
                    ->columnSpanFull(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('key_name')
            ->columns([
                TextColumn::make('category')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'api_key' => 'info',
                        'webhook_secret' => 'warning',
                        'oauth_token' => 'success',
                        'db_password' => 'danger',
                        'ssh_key' => 'gray',
                        default => 'gray',
                    }),
                TextColumn::make('key_name')
                    ->label('Identifier')
                    ->searchable()
                    ->weight('bold'),
                TextColumn::make('environment')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'production' => 'danger',
                        'staging' => 'warning',
                        'local' => 'gray',
                        default => 'gray',
                    }),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                Action::make('reveal')
                    ->label('View / Copy Secret')
                    ->icon('heroicon-o-eye')
                    ->color('warning')
                    ->modalHeading(fn (ProjectCredential $record) => "Access Secret: {$record->key_name}")
                    ->modalDescription('Viewing or copying this secret is automatically logged in the audit trail.')
                    ->action(function (ProjectCredential $record) {
                        AuditService::log($record->project_id, 'VIEWED_SECRET', "{$record->key_name} [{$record->environment}]");
                    })
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close')
                    ->infolist([
                        TextEntry::make('key_name')->label('Key Name'),
                        TextEntry::make('environment')->badge(),
                        TextEntry::make('key_value')
                            ->label('Decrypted Secret Value')
                            ->copyable()
                            ->copyMessage('Secret copied to clipboard')
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
