<?php

namespace InterNACHI\BladeInstantSearch\Components;

class MenuSelect extends Widget
{
	public function __construct(
		?string $attribute = null,
		?int $limit = null,
		?string $id = null
	) {
		$this->setId($id);
		$this->setWidgetData(array_filter(compact(
			'attribute',
			'limit'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::menu-select');
	}
	
	protected function widgetDefaults(): string
	{
		return '{ items: [], canRefine: false, refine: null, sendEvent: null, widgetParams: {} }';
	}
}
