<?php

namespace App\Enums;

enum ProjectType: string
{
    case WEB_APP = 'web_app';
    case MOBILE_APP = 'mobile_app';
    case IOT_EMBEDDED = 'iot_embedded';
    case API_SERVICE = 'api_service';
    case HYBRID = 'hybrid';

    public function label(): string
    {
        return match ($this) {
            self::WEB_APP => 'Web apps',
            self::MOBILE_APP => 'Mobile apps',
            self::IOT_EMBEDDED => 'IoT & hardware',
            self::API_SERVICE => 'API services',
            self::HYBRID => 'Hybrid',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::WEB_APP => 'info',
            self::MOBILE_APP => 'success',
            self::IOT_EMBEDDED => 'warning',
            self::API_SERVICE => 'danger',
            self::HYBRID => 'primary',
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
