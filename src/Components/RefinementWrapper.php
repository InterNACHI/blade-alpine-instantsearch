<?php

namespace InterNACHI\BladeInstantSearch\Components;

class RefinementWrapper extends RefinementList
{
	public function render()
	{
		return view('instantsearch::refinement-wrapper');
	}
}
