<?php

namespace InterNACHI\BladeInstantSearch\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use Illuminate\View\Compilers\BladeCompiler;
use InterNACHI\BladeInstantSearch\BladeInstantSearch;
use InterNACHI\BladeInstantSearch\Components\InstantSearch;

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
		], ['instantsearch']);
		
		$this->loadViewsFrom($this->helper->path('resources/views'), 'instantsearch');
		
		$this->callAfterResolving(BladeCompiler::class, function(BladeCompiler $blade) {
			$blade->component(InstantSearch::class, 'instantsearch');
		});
		
		Blade::componentNamespace('InterNACHI\\BladeInstantSearch\\Components', 'instantsearch');
	}
}
