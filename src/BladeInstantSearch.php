<?php

namespace InterNACHI\BladeInstantSearch;

use InterNACHI\BladeInstantSearch\Components\InstantSearch;

class BladeInstantSearch
{
	protected array $context_stack = [];
	
	public function path($to = ''): string
	{
		$from = dirname(__DIR__);
		
		if (empty($to)) {
			return $from;
		}
		
		$to = ltrim(str_replace('/', DIRECTORY_SEPARATOR, $to), DIRECTORY_SEPARATOR);
		
		return $from.DIRECTORY_SEPARATOR.$to;
	}
	
	public function currentContext(): InstantSearch
	{
		return end($this->context_stack);
	}
	
	public function pushContext(InstantSearch $context): InstantSearch
	{
		$this->context_stack[] = $context;
		
		return $context;
	}
	
	public function popContext(): ?InstantSearch
	{
		return array_pop($this->context_stack);
	}
}
