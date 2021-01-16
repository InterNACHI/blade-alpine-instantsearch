<?php

namespace InterNACHI\BladeInstantSearch\Support;

use Illuminate\Support\ServiceProvider;
use InterNACHI\BladeInstantSearch\Components\InstantSearch;
use InterNACHI\BladeInstantSearch\Components\Hit;
use InterNACHI\BladeInstantSearch\Components\Hits;
use InterNACHI\BladeInstantSearch\Components\RefinementList;
use InterNACHI\BladeInstantSearch\Components\SearchBox;

class ContextStack
{
	protected array $stack = [];
	
	public function current(): InstantSearch
	{
		return end($this->stack);
	}
	
	public function push(InstantSearch $context): InstantSearch
	{
		$this->stack[] = $context;
		
		return $context;
	}
	
	public function pop(): ?InstantSearch
	{
		return array_pop($this->stack);
	}
}
