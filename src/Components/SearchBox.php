<?php

namespace InterNACHI\BladeInstantSearch\Components;

class SearchBox extends Widget
{
	public function render()
	{
		return view('instantsearch::search-box');
	}
	
	protected function variableDefaults() : array
	{
		return [
			'query' => '',
		];
	}
}
