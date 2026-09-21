<?php

namespace App\Filament\Resources\Projects\RelationManagers;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class LinksRelationManager extends RelationManager
{
    protected static string $relationship = 'links';

    protected static ?string $title = 'Repositories & External Links';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('category')
                    ->options([
                        'github' => 'GitHub',
                        'gitlab' => 'GitLab',
                        'bitbucket' => 'Bitbucket',
                        'figma' => 'Figma',
                        'postman' => 'Postman',
                        'jira' => 'Jira / Project Tracker',
                    ])
                    ->default('github')
                    ->required(),
                TextInput::make('title')
                    ->placeholder('e.g. Backend API Repo')
                    ->required(),
                TextInput::make('url')
                    ->label('Resource / Repo URL')
                    ->url()
                    ->required()
                    ->columnSpanFull(),
                TextInput::make('branch_strategy')
                    ->placeholder('e.g. main -> Production, develop -> Staging')
                    ->columnSpanFull(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('title')
            ->columns([
                TextColumn::make('category')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'github' => 'gray',
                        'gitlab' => 'warning',
                        'bitbucket' => 'info',
                        'figma' => 'success',
                        'postman' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('title')
                    ->weight('bold')
                    ->searchable(),
                TextColumn::make('url')
                    ->label('Link')
                    ->url(fn ($record) => $record->url, true)
                    ->color('primary')
                    ->limit(40),
                TextColumn::make('branch_strategy')
                    ->label('Branch Strategy')
                    ->limit(30),
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
