<?php

namespace App\Enums;

enum Quality: string
{
    case FAST = 'FAST';
    case BALANCED = 'BALANCED';
    case BEST = 'BEST';

    /** @return array<int, string> */
    public static function toArray(): array
    {
        return array_column(self::cases(), 'value');
    }
}
