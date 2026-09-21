<?php

namespace App\Filament\Resources\Projects\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ProjectForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Core Project Information')
                    ->description('Essential metadata, classification, and lead assignment')
                    ->schema([
                        Grid::make(2)->schema([
                            TextInput::make('name')
                                ->label('Project Name')
                                ->placeholder('e.g. School Pickup Taxi & Attendance System')
                                ->required(),
                            TextInput::make('code')
                                ->label('Project Code / Slug')
                                ->placeholder('e.g. SP-TAXI-2026')
                                ->unique(ignoreRecord: true)
                                ->required(),
                        ]),
                        Grid::make(3)->schema([
                            Select::make('type')
                                ->options([
                                    'web_app' => 'Web App',
                                    'mobile_app' => 'Mobile App',
                                    'iot_embedded' => 'IoT / Embedded Hardware',
                                    'api_service' => 'Backend API Microservice',
                                    'hybrid' => 'Hybrid Multi-Platform',
                                ])
                                ->default('web_app')
                                ->required(),
                            Select::make('status')
                                ->options([
                                    'planning' => 'Planning',
                                    'in_progress' => 'In Progress',
                                    'maintenance' => 'Maintenance',
                                    'completed' => 'Completed',
                                    'archived' => 'Archived',
                                ])
                                ->default('in_progress')
                                ->required(),
                            Select::make('priority')
                                ->options([
                                    'low' => 'Low',
                                    'medium' => 'Medium',
                                    'high' => 'High',
                                    'critical' => 'Critical',
                                ])
                                ->default('medium')
                                ->required(),
                        ]),
                        Grid::make(2)->schema([
                            Select::make('lead_developer_id')
                                ->label('Lead Developer')
                                ->relationship('leadDeveloper', 'name')
                                ->searchable()
                                ->preload(),
                            Select::make('manager_id')
                                ->label('Project Manager / Lead')
                                ->relationship('manager', 'name')
                                ->searchable()
                                ->preload(),
                        ]),
                        TextInput::make('tech_stack')
                            ->label('Tech Stack')
                            ->placeholder('e.g. Laravel 12, Flutter, ESP32, MQTT, MySQL, Redis')
                            ->columnSpanFull(),
                        Textarea::make('description')
                            ->label('Architecture Overview & Scope')
                            ->placeholder('High-level architectural blueprint, client objectives, and operational scope...')
                            ->rows(4)
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
