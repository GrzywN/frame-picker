<?php

namespace App\Enums;

enum Mode: string
{
    case PROFILE = 'PROFILE';
    case ACTION = 'ACTION';

    /** @return array<int, string> */
    public static function toArray(): array
    {
        return array_column(self::cases(), 'value');
    }
}
