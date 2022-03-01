<?php

namespace InterNACHI\BladeInstantSearch\Components;

class RangeInput extends Widget
{
	public function __construct(
		?string $attribute = null,
		?int $min = null,
		?int $max = null,
		?int $precision = null,
		?string $id = null
	) {
		$this->setId($id);
		$this->setWidgetData(array_filter(compact(
			'attribute',
			'min',
			'max',
			'precision'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::range-input');
	}
	
	protected function widgetDefaults(): string
	{
		return '{ start: [], range: {}, canRefine: false, refine: null, sendEvent: null, widgetParams: {} }';
	}
}
