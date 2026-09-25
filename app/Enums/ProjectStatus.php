<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case IN_PROGRESS = 'in_progress';
    case PLANNING = 'planning';
    case MAINTENANCE = 'maintenance';
    case COMPLETED = 'completed';
    case ARCHIVED = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::IN_PROGRESS => 'In progress',
            self::PLANNING => 'Planning',
            self::MAINTENANCE => 'Maintenance',
            self::COMPLETED => 'Completed',
            self::ARCHIVED => 'Archived',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::IN_PROGRESS => 'success',
            self::PLANNING => 'info',
            self::MAINTENANCE => 'warning',
            self::COMPLETED => 'primary',
            self::ARCHIVED => 'gray',
        };
    }

    public static function options(): array
    {
        return array_column(
            array_map(fn (self $case) => ['value' => $case->value, 'label' => $case->label()], self::cases()),
            'label',
            'value'
        );
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
