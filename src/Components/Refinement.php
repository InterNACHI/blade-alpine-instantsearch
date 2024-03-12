<?php

namespace InterNACHI\BladeInstantSearch\Components;

class Refinement extends RefinementList
{
	public function render()
	{
		return view('instantsearch::refinement');
	}
	
	protected function widgetName(): string
	{
		return 'RefinementList';
	}
}
