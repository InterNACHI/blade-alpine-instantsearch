<?php

namespace InterNACHI\BladeInstantSearch\Components;

class Menu extends Widget
{
	public function __construct(
		?string $attribute = null,
		?int $limit = null,
		?bool $showMore = null,
		?int $showMoreLimit = null,
		?string $id = null
	) {
		$this->setId($id);
		$this->setWidgetData(array_filter(compact(
			'attribute',
			'limit',
			'showMore',
			'showMoreLimit'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::menu');
	}
	
	protected function widgetDefaults(): string
	{
		return '{ items: [], canRefine: false, isShowingMore: false, canToggleShowMore: false, refine: null, sendEvent: null, createURL: null, toggleShowMore: null, widgetParams: {} }';
	}
}
