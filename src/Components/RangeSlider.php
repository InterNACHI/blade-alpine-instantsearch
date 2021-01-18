<?php

namespace InterNACHI\BladeInstantSearch\Components;

class RangeSlider extends Widget
{
	public function __construct(
		?string $attribute = null,
		?int $min = null,
		?int $max = null,
		?int $precision = null,
		?int $step = null,
		?bool $pips = null,
		?string $id = null
	) {
		$this->setId($id);
		$this->setWidgetData(array_filter(compact(
			'attribute',
			'min',
			'max',
			'precision',
			'step',
			'pips'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::range-slider');
	}
}