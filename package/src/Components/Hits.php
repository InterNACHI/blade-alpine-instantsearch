<?php

namespace InterNACHI\BladeInstantSearch\Components;

class Hits extends ConnectedComponent
{
	public function render()
	{
		return view('instantsearch::hits');
	}
}
