<?php

namespace InterNACHI\BladeInstantSearch\Components;

class RefinementList extends ConnectedComponent
{
	public function __construct($attribute, $operator = 'or', $id = null)
	{
		$id = $this->setId($id);
		
		$this->setWidgetData(compact('id', 'attribute', 'operator'));
	}
	
	public function render()
	{
		return view('instantsearch::refinement-list');
	}
}
