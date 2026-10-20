<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\View\Component;

class Snippet extends Component
{
	public function __construct(
		public string $attribute,
		public string $highlightedTagName = 'mark',
		public string $tagName = 'span'
	) {
	}
	
	public function render()
	{
		return view('instantsearch::snippet');
	}
}
