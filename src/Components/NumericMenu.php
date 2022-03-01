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
	
	protected function widgetDefaults(): string
	{
		return '{ items: [], hasNoResults: true, refine: null, sendEvent: null, createURL: null, widgetParams: {} }';
	}
}
