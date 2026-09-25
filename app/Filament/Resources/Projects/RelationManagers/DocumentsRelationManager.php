<?php

namespace App\Filament\Resources\Projects\RelationManagers;

use App\Models\ProjectDocument;
use App\Services\AuditService;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

use Illuminate\Database\Eloquent\Model;

class DocumentsRelationManager extends RelationManager
{
    protected static string $relationship = 'documents';

    protected static ?string $title = 'Documents & Uploads';

    protected static string | \BackedEnum | null $icon = 'heroicon-o-folder';

    public static function getBadge(Model $ownerRecord, string $pageClass): ?string
    {
        $count = $ownerRecord->documents()->count();
        return $count > 0 ? (string) $count : '0';
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('title')
                    ->label('Document Title')
                    ->placeholder('e.g. Architecture Diagram, SRS Specs, Pinout Diagram')
                    ->required(),
                Select::make('file_type')
                    ->options([
                        'pdf' => 'PDF Specification',
                        'docx' => 'Word Document',
                        'image' => 'Diagram / Architecture Image',
                        'zip' => 'Zip Archive / Backups',
                    ])
                    ->default('pdf'),
                FileUpload::make('file_path')
                    ->label('Upload File')
                    ->disk('public')
                    ->directory('project-documents')
                    ->required()
                    ->columnSpanFull(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('title')
            ->columns([
                TextColumn::make('title')
                    ->weight('bold')
                    ->searchable(),
                TextColumn::make('file_type')
                    ->badge()
                    ->color('primary'),
                TextColumn::make('file_path')
                    ->label('Stored Path')
                    ->limit(30),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                Action::make('download')
                    ->label(fn (ProjectDocument $record) => str_starts_with($record->file_path, 'http') || $record->file_type === 'external' ? 'Open Link' : 'Download')
                    ->icon(fn (ProjectDocument $record) => str_starts_with($record->file_path, 'http') || $record->file_type === 'external' ? 'heroicon-o-arrow-top-right-on-square' : 'heroicon-o-arrow-down-tray')
                    ->color(fn (ProjectDocument $record) => str_starts_with($record->file_path, 'http') || $record->file_type === 'external' ? 'info' : 'success')
                    ->action(function (ProjectDocument $record) {
                        AuditService::log($record->project_id, 'DOWNLOADED_DOC', "Document: {$record->title}");
                    })
                    ->url(fn (ProjectDocument $record) => str_starts_with($record->file_path, 'http') ? $record->file_path : asset('storage/' . $record->file_path), true),
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
