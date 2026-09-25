<?php

namespace App\Filament\Resources\Projects\Pages;

use App\Filament\Resources\Projects\ProjectResource;
use Filament\Actions\Action;
use Filament\Resources\Pages\ViewRecord;
use Filament\Schemas\Components\Component;
use Filament\Schemas\Components\Tabs;

use Filament\Schemas\Schema;
use Filament\Support\Enums\Width;

class ViewProject extends ViewRecord
{
    protected static string $resource = ProjectResource::class;

    public function getMaxContentWidth(): Width | string | null
    {
        return Width::Full;
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('back')
                ->label('Back to Projects')
                ->icon('heroicon-o-arrow-left')
                ->color('gray')
                ->url(ProjectResource::getUrl('index')),
        ];
    }

    public function content(Schema $schema): Schema
    {
        return parent::content($schema)->columns(1);
    }

    public function getRelationManagersContentComponent(): Component
    {
        $component = parent::getRelationManagersContentComponent();

        if ($component instanceof Tabs) {
            $component->vertical();
        }

        return $component;
    }
}
