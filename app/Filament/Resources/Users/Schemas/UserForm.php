<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Hash;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('User Account & Access Level')
                    ->schema([
                        Grid::make(2)->schema([
                            TextInput::make('name')
                                ->required()
                                ->maxLength(255),
                            TextInput::make('email')
                                ->email()
                                ->required()
                                ->unique(ignoreRecord: true)
                                ->maxLength(255),
                        ]),
                        Grid::make(2)->schema([
                            Select::make('role')
                                ->options([
                                    'superadmin' => 'Super Admin (Full System Authority)',
                                    'admin' => 'Administrator (Full Access)',
                                    'developer' => 'Developer (Assigned Projects & Developer Portal)',
                                    'qa' => 'QA Engineer (QA Data Access Only)',
                                ])
                                ->default('developer')
                                ->required(),
                            TextInput::make('password')
                                ->password()
                                ->revealable()
                                ->dehydrateStateUsing(fn ($state) => filled($state) ? Hash::make($state) : null)
                                ->dehydrated(fn ($state) => filled($state))
                                ->required(fn (string $context): bool => $context === 'create'),
                        ]),
                    ]),
            ]);
    }
}
