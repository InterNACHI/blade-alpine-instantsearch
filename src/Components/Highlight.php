<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\View\Component;

class Highlight extends Component
{
	public string $attribute;
	
	public string $tagName;
	
	public function __construct(string $attribute, string $tagName = 'div')
	{
		$this->attribute = $attribute;
		$this->tagName = $tagName;
	}
	
	public function render()
	{
		return view('instantsearch::highlight');
	}
}
