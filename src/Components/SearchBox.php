<?php

namespace InterNACHI\BladeInstantSearch\Components;

class SearchBox extends Widget
{
	public function __construct(
		?string $placeholder = null,
		?bool $autofocus = null,
		?bool $searchAsYouType = null,
		?bool $showReset = null,
		?bool $showSubmit = null,
		?bool $showLoadingIndicator = null
	) {
		$this->setWidgetData(array_filter(compact(
			'placeholder',
			'autofocus',
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
	
	protected function variableDefaults() : array
	{
		return [
			'query' => '',
		];
	}
}
