<?php

namespace App\Filament\Resources\Projects\RelationManagers;

use App\Models\ThirdPartyAccount;
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

class ThirdPartyAccountsRelationManager extends RelationManager
{
    protected static string $relationship = 'thirdPartyAccounts';

    protected static ?string $title = 'Third-Party & Cloud Accounts';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('service_provider')
                    ->label('Service Provider')
                    ->placeholder('e.g. Google Cloud Platform, Firebase, Twilio, AWS')
                    ->required(),
                TextInput::make('account_identifier')
                    ->label('Login Email / Identifier')
                    ->placeholder('e.g. devops@enrich.com')
                    ->required(),
                TextInput::make('login_password')
                    ->label('Password / Token (Encrypted at Rest)')
                    ->password()
                    ->revealable(),
                TextInput::make('console_url')
                    ->label('Console Dashboard URL')
                    ->url()
                    ->placeholder('https://console.cloud.google.com'),
                TextInput::make('project_or_app_id')
                    ->label('Project / App / Account ID')
                    ->placeholder('e.g. GCP Project ID, Firebase App ID'),
                Select::make('environment')
                    ->options([
                        'development' => 'Development / Testing',
                        'testing' => 'Staging / QA',
                        'production' => 'Production',
                    ])
                    ->default('production')
                    ->required(),
                Textarea::make('notes')
                    ->label('2FA Details, Recovery Codes & Access Notes')
                    ->rows(3)
                    ->columnSpanFull(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('service_provider')
            ->columns([
                TextColumn::make('service_provider')
                    ->weight('bold')
                    ->searchable(),
                TextColumn::make('account_identifier')
                    ->label('Login Account')
                    ->searchable()
                    ->copyable(),
                TextColumn::make('project_or_app_id')
                    ->label('Project / App ID'),
                TextColumn::make('environment')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'production' => 'danger',
                        'testing' => 'warning',
                        'development' => 'gray',
                        default => 'gray',
                    }),
                TextColumn::make('console_url')
                    ->label('Console')
                    ->url(fn ($record) => $record->console_url, true)
                    ->color('primary')
                    ->limit(30),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                Action::make('view_credentials')
                    ->label('View Login & 2FA')
                    ->icon('heroicon-o-lock-closed')
                    ->color('warning')
                    ->action(function (ThirdPartyAccount $record) {
                        AuditService::log($record->project_id, 'VIEWED_SECRET', "Account: {$record->service_provider} ({$record->account_identifier})");
                    })
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close')
                    ->infolist([
                        TextEntry::make('service_provider')->weight('bold'),
                        TextEntry::make('account_identifier')->copyable(),
                        TextEntry::make('login_password')
                            ->label('Decrypted Password')
                            ->copyable()
                            ->copyMessage('Password copied to clipboard'),
                        TextEntry::make('console_url')->url(fn ($record) => $record->console_url, true),
                        TextEntry::make('project_or_app_id')->copyable(),
                        TextEntry::make('notes')->columnSpanFull(),
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
