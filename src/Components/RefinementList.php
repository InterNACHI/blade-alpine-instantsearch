<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\Support\Str;

class RefinementList extends Widget
{
	public string $id;
	
	public bool $searchable;
	
	public bool $show_more;
	
	public ?string $searchable_placeholder;
	
	public function __construct(
		string $attribute,
		string $operator = 'or',
		int $limit = 10,
		bool $showMore = false,
		?int $showMoreLimit = null,
		bool $searchable = false,
		string $searchablePlaceholder = 'Search…',
		bool $searchableIsAlwaysActive = true,
		bool $searchableEscapeFacetValues = true,
		?array $sortBy = null,
		?string $id = null
	) {
		$this->id = $id ?? Str::random();
		$this->show_more = $showMore;
		$this->searchable = $searchable;
		$this->searchable_placeholder = $searchablePlaceholder ?? 'Search…';
		
		$this->setWidgetData(array_filter(compact(
			'id',
			'attribute',
			'operator',
			'limit',
			'showMore',
			'showMoreLimit',
			'searchable',
			'searchablePlaceholder',
			'searchableIsAlwaysActive',
			'searchableEscapeFacetValues',
			'sortBy'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::refinement-list');
	}
	
	protected function widgetDefaults(): string
	{
		return '{ items: [], canRefine: false, refine: null, sendEvent: null, createURL: null, isFromSearch: false, searchForItems: null, isShowingMore: false, canToggleShowMore: false, toggleShowMore: null, widgetParams: {} }';
	}
}
