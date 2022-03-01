<?php

namespace InterNACHI\BladeInstantSearch\Components;

class HierarchicalMenu extends Widget
{
	public function __construct(
		?array $attributes = null,
		?int $limit = null,
		?bool $showMore = null,
		?int $showMoreLimit = null,
		?string $separator = null,
		?string $rootPath = null,
		?bool $showParentLevel = null,
		?string $id = null
	) {
		$this->setWidgetData(array_filter(compact(
			'attributes',
			'limit',
			'showMore',
			'showMoreLimit',
			'separator',
			'rootPath',
			'showParentLevel'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::hierarchical-menu');
	}
	
	protected function widgetDefaults(): string
	{
		return '{ items: [], isShowingMore: false, canToggleShowMore: false, canRefine: false, refine: null, sendEvent: null, toggleShowMore: null, createURL: null, widgetParams: {} }';
	}
}
