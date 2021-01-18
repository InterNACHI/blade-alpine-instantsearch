<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\View\Component;

class Hit extends Component
{
	public string $attribute;
	
	public string $tagName;
	
	public function __construct(string $attribute, string $tagName = 'span')
	{
		$this->attribute = $attribute;
		$this->tagName = $tagName;
	}
	
	public function render()
	{
		return view('instantsearch::hit');
	}
}
