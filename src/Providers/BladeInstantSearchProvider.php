<?php

namespace InterNACHI\BladeInstantSearch\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\View\Compilers\BladeCompiler;
use InterNACHI\BladeInstantSearch\BladeInstantSearch;
use InterNACHI\BladeInstantSearch\Components\Highlight;
use InterNACHI\BladeInstantSearch\Components\Hit;
use InterNACHI\BladeInstantSearch\Components\Hits;
use InterNACHI\BladeInstantSearch\Components\InstantSearch;
use InterNACHI\BladeInstantSearch\Components\RefinementList;
use InterNACHI\BladeInstantSearch\Components\SearchBox;

class BladeInstantSearchProvider extends ServiceProvider
{
	protected BladeInstantSearch $helper;
	
	public function register()
	{
		$this->helper = new BladeInstantSearch();
		$this->app->instance(BladeInstantSearch::class, $this->helper);
		
		$this->mergeConfigFrom($this->helper->path('config.php'), 'instantsearch');
	}
	
	public function boot()
	{
		$this->publishes([
			$this->helper->path('config.php') => config_path('instantsearch.php'),
			$this->helper->path('resources/views') => resource_path('views/vendor/instantsearch'),
		]);
		
		$this->loadViewsFrom($this->helper->path('resources/views'), 'instantsearch');
		
		$this->callAfterResolving(BladeCompiler::class, function(BladeCompiler $blade) {
			$blade->component(InstantSearch::class, 'instantsearch');
		});
		
		$this->loadViewComponentsAs('instantsearch', [
			SearchBox::class,
			RefinementList::class,
			Hits::class,
			Highlight::class,
			Hit::class,
		]);
	}
}
