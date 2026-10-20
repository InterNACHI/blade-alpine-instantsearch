<?php

namespace InterNACHI\BladeInstantSearch\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @method static string path(string $to = '')
 * @method static \InterNACHI\BladeInstantSearch\Components\InstantSearch currentContext()
 * @method static \InterNACHI\BladeInstantSearch\Components\InstantSearch pushContext(\InterNACHI\BladeInstantSearch\Components\InstantSearch $context)
 * @method static \InterNACHI\BladeInstantSearch\Components\InstantSearch|null popContext()
 *
 * @see \InterNACHI\BladeInstantSearch\BladeInstantSearch
 */
class BladeInstantSearch extends Facade
{
	protected static function getFacadeAccessor()
	{
		return \InterNACHI\BladeInstantSearch\BladeInstantSearch::class;
	}
}
