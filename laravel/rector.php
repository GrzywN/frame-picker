<?php

declare(strict_types=1);

use Rector\CodeQuality\Rector\Empty_\SimplifyEmptyCheckOnEmptyArrayRector;
use Rector\CodeQuality\Rector\Identical\FlipTypeControlToUseExclusiveTypeRector;
use Rector\CodingStyle\Rector\Catch_\CatchExceptionNameMatchingTypeRector;
use Rector\CodingStyle\Rector\ClassMethod\NewlineBeforeNewAssignSetRector;
use Rector\CodingStyle\Rector\Closure\StaticClosureRector;
use Rector\CodingStyle\Rector\Encapsed\EncapsedStringsToSprintfRector;
use Rector\CodingStyle\Rector\FuncCall\CountArrayToEmptyArrayComparisonRector;
use Rector\CodingStyle\Rector\Stmt\NewlineAfterStatementRector;
use Rector\CodingStyle\Rector\String_\SymplifyQuoteEscapeRector;
use Rector\Config\RectorConfig;
use Rector\DeadCode\Rector\ClassMethod\RemoveEmptyClassMethodRector;
use Rector\Php54\Rector\Array_\LongArrayToShortArrayRector;
use Rector\Php74\Rector\Closure\ClosureToArrowFunctionRector;
use Rector\Privatization\Rector\Property\PrivatizeFinalClassPropertyRector;
use Rector\Set\ValueObject\LevelSetList;
use Rector\Set\ValueObject\SetList;
use Rector\Strict\Rector\Empty_\DisallowedEmptyRuleFixerRector;
use Rector\ValueObject\PhpVersion;
use Rector\Visibility\Rector\ClassConst\ChangeConstantVisibilityRector;
use Rector\Visibility\Rector\ClassMethod\ChangeMethodVisibilityRector;
use Rector\Visibility\Rector\ClassMethod\ExplicitPublicClassMethodRector;
use RectorLaravel\Set\LaravelSetList;

$paths = [
    __DIR__.'/app',
    __DIR__.'/database',
    __DIR__.'/routes',
    __DIR__.'/tests',
];

return RectorConfig::configure()
    ->withPhpVersion(phpVersion: PhpVersion::PHP_83)
    ->withPaths(paths: $paths)
    ->withSets([
        LevelSetList::UP_TO_PHP_83,
        LaravelSetList::LARAVEL_110,
        SetList::CODE_QUALITY,
        SetList::CODING_STYLE,
        SetList::DEAD_CODE,
        SetList::EARLY_RETURN,
        SetList::TYPE_DECLARATION,
    ])
    ->withRules(rules: [
        PrivatizeFinalClassPropertyRector::class,
        ChangeConstantVisibilityRector::class,
        ChangeMethodVisibilityRector::class,
        ExplicitPublicClassMethodRector::class,
        StaticClosureRector::class,
    ])
    ->withSkip(skip: [
        LongArrayToShortArrayRector::class => $paths,
        ClosureToArrowFunctionRector::class => [
            __DIR__.'/app/Providers/AuthServiceProvider.php',
        ],
        FlipTypeControlToUseExclusiveTypeRector::class => $paths,
        SimplifyEmptyCheckOnEmptyArrayRector::class => $paths,
        CatchExceptionNameMatchingTypeRector::class => $paths,
        CountArrayToEmptyArrayComparisonRector::class => $paths,
        EncapsedStringsToSprintfRector::class => $paths,
        NewlineAfterStatementRector::class => $paths,
        NewlineBeforeNewAssignSetRector::class => $paths,
        StaticClosureRector::class => [
            __DIR__.'/tests',
        ],
        SymplifyQuoteEscapeRector::class => $paths,
        RemoveEmptyClassMethodRector::class => $paths,
        DisallowedEmptyRuleFixerRector::class => $paths,
    ]);
