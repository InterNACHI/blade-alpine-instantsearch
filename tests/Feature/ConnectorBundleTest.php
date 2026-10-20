<?php

namespace InterNACHI\BladeInstantSearch\Tests\Feature;

use InterNACHI\BladeInstantSearch\Components\Widget;
use InterNACHI\BladeInstantSearch\Facades\BladeInstantSearch;
use InterNACHI\BladeInstantSearch\Tests\TestCase;
use ReflectionClass;
use ReflectionMethod;

class ConnectorBundleTest extends TestCase
{
	public function test_slim_bundles_include_the_connector_for_every_component(): void
	{
		$source = file_get_contents(BladeInstantSearch::path('js/src/component-connectors.ts'));
		preg_match_all('/\bconnect([A-Z]\w+)/', $source, $matches);
		
		$bundled = collect($matches[1])->unique()->sort()->values()->all();
		
		$this->assertSame($this->componentConnectors(), $bundled);
	}
	
	protected function componentConnectors(): array
	{
		return collect(glob(BladeInstantSearch::path('src/Components/*.php')))
			->map(fn($file) => 'InterNACHI\\BladeInstantSearch\\Components\\'.basename($file, '.php'))
			->filter(fn($class) => is_subclass_of($class, Widget::class) && ! (new ReflectionClass($class))->isAbstract())
			->map(function($class) {
				$widget = (new ReflectionClass($class))->newInstanceWithoutConstructor();
				$method = new ReflectionMethod($widget, 'widgetName');
				
				return $method->invoke($widget);
			})
			->unique()
			->sort()
			->values()
			->all();
	}
}
