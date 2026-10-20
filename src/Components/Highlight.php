<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\View\Component;

class Highlight extends Component
{
	public function __construct(
		public string $attribute,
		public string $tagName = 'div'
	) {
	}
	
	public function render()
	{
		return view('instantsearch::highlight');
	}
}
