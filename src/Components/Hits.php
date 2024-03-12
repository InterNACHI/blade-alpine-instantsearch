<?php

namespace InterNACHI\BladeInstantSearch\Components;

class Hits extends Widget
{
	public function __construct(
		?bool $escapeHTML = null
	) {
		$this->setWidgetData(array_filter(compact(
			'escapeHTML'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::hits');
	}
	
	protected function widgetDefaults(): string
	{
		return '{ hits: [], results: {}, sendEvent: null, widgetParams: null }';
	}
}
