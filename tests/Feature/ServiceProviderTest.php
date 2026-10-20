<?php

namespace InterNACHI\BladeInstantSearch\Tests\Feature;

use Illuminate\Support\ServiceProvider;
use InterNACHI\BladeInstantSearch\BladeInstantSearch;
use InterNACHI\BladeInstantSearch\Components\InstantSearch;
use InterNACHI\BladeInstantSearch\Facades\BladeInstantSearch as BladeInstantSearchFacade;
use InterNACHI\BladeInstantSearch\Providers\BladeInstantSearchProvider;
use InterNACHI\BladeInstantSearch\Tests\TestCase;

class ServiceProviderTest extends TestCase
{
	public function test_helper_is_registered_as_a_singleton(): void
	{
		$this->assertInstanceOf(BladeInstantSearch::class, $this->app->make(BladeInstantSearch::class));
		$this->assertSame($this->app->make(BladeInstantSearch::class), $this->app->make(BladeInstantSearch::class));
		$this->assertSame($this->app->make(BladeInstantSearch::class), BladeInstantSearchFacade::getFacadeRoot());
	}
	
	public function test_default_config_is_merged(): void
	{
		$this->assertTrue(config('instantsearch.bundle_alpine'));
		$this->assertTrue(config('instantsearch.bundle_algolia'));
		$this->assertTrue(config('instantsearch.bundle_all_connectors'));
		$this->assertFalse(config('instantsearch.renderless'));
	}
	
	public function test_config_and_views_are_publishable(): void
	{
		$paths = ServiceProvider::pathsToPublish(BladeInstantSearchProvider::class, 'instantsearch');
		
		$this->assertSame([
			BladeInstantSearchFacade::path('config.php') => config_path('instantsearch.php'),
			BladeInstantSearchFacade::path('resources/views') => resource_path('views/vendor/instantsearch'),
		], $paths);
	}
	
	public function test_views_are_namespaced(): void
	{
		$this->assertTrue(view()->exists('instantsearch::context'));
		$this->assertTrue(view()->exists('instantsearch::connected-component'));
	}
	
	public function test_path_helper(): void
	{
		$root = dirname(__DIR__, 2);
		
		$this->assertSame($root, BladeInstantSearchFacade::path());
		$this->assertSame($root.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'dist', BladeInstantSearchFacade::path('/js/dist'));
		$this->assertSame($root.DIRECTORY_SEPARATOR.'config.php', BladeInstantSearchFacade::path('config.php'));
	}
	
	public function test_context_stack(): void
	{
		$helper = new BladeInstantSearch();
		
		$first = $this->app->make(InstantSearch::class, ['applicationId' => 'A', 'searchKey' => 'K', 'indexName' => 'one']);
		$second = $this->app->make(InstantSearch::class, ['applicationId' => 'A', 'searchKey' => 'K', 'indexName' => 'two']);
		
		$this->assertSame($first, $helper->pushContext($first));
		$this->assertSame($first, $helper->currentContext());
		
		$helper->pushContext($second);
		$this->assertSame($second, $helper->currentContext());
		
		$this->assertSame($second, $helper->popContext());
		$this->assertSame($first, $helper->currentContext());
		$this->assertSame($first, $helper->popContext());
		$this->assertNull($helper->popContext());
	}
}
