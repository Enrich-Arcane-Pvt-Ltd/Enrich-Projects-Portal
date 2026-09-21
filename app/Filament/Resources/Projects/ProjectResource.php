<?php

namespace App\Filament\Resources\Projects;

use App\Filament\Resources\Projects\Pages\CreateProject;
use App\Filament\Resources\Projects\Pages\EditProject;
use App\Filament\Resources\Projects\Pages\ListProjects;
use App\Filament\Resources\Projects\Pages\ViewProject;
use App\Filament\Resources\Projects\RelationManagers\BackgroundServicesRelationManager;
use App\Filament\Resources\Projects\RelationManagers\CredentialsRelationManager;
use App\Filament\Resources\Projects\RelationManagers\DevelopersRelationManager;
use App\Filament\Resources\Projects\RelationManagers\DocumentsRelationManager;
use App\Filament\Resources\Projects\RelationManagers\IotConfigurationsRelationManager;
use App\Filament\Resources\Projects\RelationManagers\LinksRelationManager;
use App\Filament\Resources\Projects\RelationManagers\ServerEnvironmentsRelationManager;
use App\Filament\Resources\Projects\RelationManagers\ThirdPartyAccountsRelationManager;
use App\Filament\Resources\Projects\Schemas\ProjectForm;
use App\Filament\Resources\Projects\Schemas\ProjectInfolist;
use App\Filament\Resources\Projects\Tables\ProjectsTable;
use App\Models\Project;
use BackedEnum;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class ProjectResource extends Resource
{
    protected static ?string $model = Project::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedFolder;

    protected static UnitEnum|string|null $navigationGroup = 'Project Management';

    protected static ?int $navigationSort = 1;

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Schema $schema): Schema
    {
        return ProjectForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return ProjectInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ProjectsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            CredentialsRelationManager::class,
            LinksRelationManager::class,
            ServerEnvironmentsRelationManager::class,
            ThirdPartyAccountsRelationManager::class,
            BackgroundServicesRelationManager::class,
            IotConfigurationsRelationManager::class,
            DocumentsRelationManager::class,
            DevelopersRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListProjects::route('/'),
            'create' => CreateProject::route('/create'),
            'view' => ViewProject::route('/{record}'),
            'edit' => EditProject::route('/{record}/edit'),
        ];
    }

    public static function getGloballySearchableAttributes(): array
    {
        return ['name', 'code', 'tech_stack', 'description'];
    }
}
