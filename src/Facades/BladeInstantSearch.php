<?php

namespace InterNACHI\BladeInstantSearch\Facades;

use Illuminate\Support\Facades\Facade;

class BladeInstantSearch extends Facade
{
	protected static function getFacadeAccessor()
	{
		return \InterNACHI\BladeInstantSearch\BladeInstantSearch::class;
	}
}
