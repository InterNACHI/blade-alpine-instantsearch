<?php

namespace InterNACHI\BladeInstantSearch\Components;

class SearchBox extends Widget
{
	public function __construct(
		?bool $searchAsYouType = null,
		?bool $showReset = null,
		?bool $showSubmit = null,
		?bool $showLoadingIndicator = null
	) {
		$this->setWidgetData(array_filter(compact(
			'searchAsYouType',
			'showReset',
			'showSubmit',
			'showLoadingIndicator'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::search-box');
	}
	
	protected function widgetDefaults(): string
	{
		return "{ query: '', refine: null, clear: null, isSearchStalled: false, widgetParams: {} }";
	}
}
