<?php

namespace InterNACHI\BladeInstantSearch\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use Illuminate\View\Compilers\BladeCompiler;
use InterNACHI\BladeInstantSearch\BladeInstantSearch;
use InterNACHI\BladeInstantSearch\Components\Breadcrumb;
use InterNACHI\BladeInstantSearch\Components\ClearRefinements;
use InterNACHI\BladeInstantSearch\Components\CurrentRefinements;
use InterNACHI\BladeInstantSearch\Components\HierarchicalMenu;
use InterNACHI\BladeInstantSearch\Components\Highlight;
use InterNACHI\BladeInstantSearch\Components\Hit;
use InterNACHI\BladeInstantSearch\Components\Hits;
use InterNACHI\BladeInstantSearch\Components\InstantSearch;
use InterNACHI\BladeInstantSearch\Components\Menu;
use InterNACHI\BladeInstantSearch\Components\MenuSelect;
use InterNACHI\BladeInstantSearch\Components\NumericMenu;
use InterNACHI\BladeInstantSearch\Components\Pagination;
use InterNACHI\BladeInstantSearch\Components\RangeSlider;
use InterNACHI\BladeInstantSearch\Components\RatingMenu;
use InterNACHI\BladeInstantSearch\Components\RefinementList;
use InterNACHI\BladeInstantSearch\Components\SearchBox;
use InterNACHI\BladeInstantSearch\Components\SortBy;
use InterNACHI\BladeInstantSearch\Components\ToggleRefinement;

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
		
		// $this->loadViewComponentsAs('instantsearch', [
		// 	Breadcrumb::class,
		// 	ClearRefinements::class,
		// 	CurrentRefinements::class,
		// 	HierarchicalMenu::class,
		// 	Highlight::class,
		// 	Hit::class,
		// 	Hits::class,
		// 	Menu::class,
		// 	MenuSelect::class,
		// 	NumericMenu::class,
		// 	Pagination::class,
		// 	RangeSlider::class,
		// 	RatingMenu::class,
		// 	RefinementList::class,
		// 	SearchBox::class,
		// 	SortBy::class,
		// 	ToggleRefinement::class,
		// ]);
	}
}
