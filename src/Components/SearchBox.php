<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\Support\HtmlString;
use Illuminate\View\Component;

class SearchBox extends ConnectedComponent
{
	public function render()
	{
		return view('instantsearch::search-box');
	}
}
