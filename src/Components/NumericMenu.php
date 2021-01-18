<?php

namespace InterNACHI\BladeInstantSearch\Components;

class NumericMenu extends Widget
{
	public function __construct(
		?string $attribute = null,
		?string $id = null
	) {
		$this->setId($id);
		$this->setWidgetData(array_filter(compact(
			'attribute'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::numeric-menu');
	}
}