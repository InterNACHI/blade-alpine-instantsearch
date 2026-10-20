<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\View\Component;

class Hit extends Component
{
	public function __construct(
		public string $attribute,
		public string $tagName = 'span'
	) {
	}
	
	public function render()
	{
		return view('instantsearch::hit');
	}
}
