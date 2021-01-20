<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\Support\Str;

class RefinementList extends Widget
{
	public string $id;
	
	public function __construct($attribute, $operator = 'or', $id = null)
	{
		$this->id = Str::random();
		$this->setWidgetData(compact('id', 'attribute', 'operator'));
	}
	
	public function render()
	{
		return view('instantsearch::refinement-list');
	}
	
	protected function variableDefaults() : array
	{
		return [
			'items' => [],
		];
	}
}
