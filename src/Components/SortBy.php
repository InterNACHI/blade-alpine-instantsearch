<?php

namespace InterNACHI\BladeInstantSearch\Components;

class SortBy extends Widget
{
	public function __construct(
		?string $id = null
	) {
		$this->setId($id);
		$this->setWidgetData(array_filter(compact(
			
		)));
	}
	
	public function render()
	{
		return view('instantsearch::sort-by');
	}
}