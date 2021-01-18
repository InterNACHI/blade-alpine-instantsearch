<?php

namespace InterNACHI\BladeInstantSearch\Components;

class ClearRefinements extends Widget
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
		return view('instantsearch::clear-refinements');
	}
}