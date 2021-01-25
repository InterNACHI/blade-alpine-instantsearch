<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\View\Component;

class Snippet extends Component
{
	public string $attribute;
	
	public string $highlightedTagName;
	
	public string $tagName;
	
	public function __construct(string $attribute, string $highlightedTagName = 'mark', string $tagName = 'span')
	{
		$this->attribute = $attribute;
		$this->highlightedTagName = $highlightedTagName;
		$this->tagName = $tagName;
	}
	
	public function render()
	{
		return view('instantsearch::snippet');
	}
}
