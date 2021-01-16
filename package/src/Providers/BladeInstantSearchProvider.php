<?php

namespace InterNACHI\BladeInstantSearch\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\View\Compilers\BladeCompiler;
use InterNACHI\BladeInstantSearch\Components\InstantSearch;
use InterNACHI\BladeInstantSearch\Components\Hit;
use InterNACHI\BladeInstantSearch\Components\Hits;
use InterNACHI\BladeInstantSearch\Components\RefinementList;
use InterNACHI\BladeInstantSearch\Components\SearchBox;
use InterNACHI\BladeInstantSearch\Support\ContextStack;

class BladeInstantSearchProvider extends ServiceProvider
{
	protected string $packagePathBase;
	
	public function __construct($app)
	{
		parent::__construct($app);
		
		$this->packagePathBase = __DIR__.'/../..';
	}
	
	public function register()
	{
		$this->mergeConfigFrom(__DIR__.'/../../config.php', 'instantsearch');
		
		$this->app->singleton(ContextStack::class);
	}
	
	public function boot()
	{
		$this->publishes([
			__DIR__.'/../../config.php' => config_path('instantsearch.php'),
			__DIR__.'/../../resources/views' => resource_path('views/vendor/instantsearch'),
		]);
		
		$this->loadViewsFrom(__DIR__.'/../../resources/views', 'instantsearch');
		
		$this->callAfterResolving(BladeCompiler::class, function(BladeCompiler $blade) {
			$blade->component(InstantSearch::class, 'instantsearch');
		});
		
		$this->loadViewComponentsAs('instantsearch', [
			SearchBox::class,
			RefinementList::class,
			Hits::class,
		]);
	}
}
