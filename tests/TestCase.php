<?php

namespace InterNACHI\BladeInstantSearch\Tests;

use Illuminate\Foundation\Testing\Concerns\InteractsWithViews;
use InterNACHI\BladeInstantSearch\Facades\BladeInstantSearch as BladeInstantSearchFacade;
use InterNACHI\BladeInstantSearch\Providers\BladeInstantSearchProvider;
use Orchestra\Testbench\TestCase as OrchestraTestCase;

abstract class TestCase extends OrchestraTestCase
{
	use InteractsWithViews;
	
	protected function getPackageProviders($app)
	{
		return [
			BladeInstantSearchProvider::class,
		];
	}
	
	protected function getPackageAliases($app)
	{
		return [
			'BladeInstantSearch' => BladeInstantSearchFacade::class,
		];
	}
}
