<?php

namespace InterNACHI\BladeInstantSearch\Components;

class NumericMenu extends Widget
{
	public function __construct(
		string $attribute,
		array $items
	) {
		$this->setWidgetData(array_filter(compact(
			'attribute',
			'items'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::numeric-menu');
	}
	
	protected function variableDefaults() : array
	{
		return [
			'items' => []
		];
	}
}
