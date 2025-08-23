<?php

namespace App\Enums;

enum Status: string
{
    case UPLOADED = 'UPLOADED';
    case PROCESSING = 'PROCESSING';
    case COMPLETED = 'COMPLETED';
    case FAILED = 'FAILED';

    public static function default(): string
    {
        return self::UPLOADED->value;
    }

    /** @return array<int, string> */
    public static function toArray(): array
    {
        return array_column(self::cases(), 'value');
    }
}
