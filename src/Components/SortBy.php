<?php

namespace InterNACHI\BladeInstantSearch\Components;

class SortBy extends Widget
{
	public function __construct(
		?string $id = null
	) {
		$this->setId($id);
	}
	
	public function render()
	{
		return view('instantsearch::sort-by');
	}
	
	protected function widgetDefaults(): string
	{
		return '{ options: [], currentRefinement: \'\', hasNoResults: false, refine: null, widgetParams: {} }';
	}
}
