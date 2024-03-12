<?php

namespace InterNACHI\BladeInstantSearch\Components;

class Pagination extends Widget
{
	public function __construct(
		?bool $showFirst = null,
		?bool $showPrevious = null,
		?bool $showNext = null,
		?bool $showLast = null,
		?int $padding = null,
		?int $totalPages = null,
		?string $id = null
	) {
		$this->setWidgetData(array_filter(compact(
			'showFirst',
			'showPrevious',
			'showNext',
			'showLast',
			'padding',
			'totalPages'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::pagination');
	}
	
	protected function widgetDefaults(): string
	{
		return '{ pages: [], currentRefinement: 0, nbHits: 0, nbPages: 0, isFirstPage: true, isLastPage: false, canRefine: false, refine: null, createURL: null, widgetParams: null }';
	}
}
