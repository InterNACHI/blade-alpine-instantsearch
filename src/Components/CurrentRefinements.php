<?php

namespace InterNACHI\BladeInstantSearch\Components;

class CurrentRefinements extends Widget
{
	public function __construct(
		?array $includedAttributes = null,
		?array $excludedAttributes = null,
		?string $id = null
	) {
		$this->setId($id);
		$this->setWidgetData(array_filter(compact(
			'includedAttributes',
			'excludedAttributes'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::current-refinements');
	}
	
	protected function widgetDefaults(): string
	{
		return '{ items: [], canRefine: false, refine: null, createURL: null, widgetParams: {} }';
	}
}
