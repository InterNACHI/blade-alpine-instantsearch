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
	
	protected function widgetDefaults() : string
	{
		return '{ nbPages: 1, currentRefinement: 1, isFirstPage: true, isLastPage: false, pages: [] }';
	}
}
