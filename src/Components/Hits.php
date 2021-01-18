<?php

namespace InterNACHI\BladeInstantSearch\Components;

class Hits extends Widget
{
	public function render()
	{
		return view('instantsearch::hits');
	}
}
