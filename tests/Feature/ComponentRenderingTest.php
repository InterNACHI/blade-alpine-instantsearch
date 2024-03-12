<?php

namespace InterNACHI\BladeInstantSearch\Tests\Feature;

use Illuminate\Support\Js;
use Illuminate\Support\Str;
use InterNACHI\BladeInstantSearch\Tests\TestCase;

class ComponentRenderingTest extends TestCase
{
	public function test_it_renders_the_root_component(): void
	{
		$expected_payload = [
			'applicationId' => Str::random(),
			'searchKey' => Str::random(),
			'indexName' => Str::random(),
		];
		
		$result = $this->blade(<<<'BLADE'
			<x-instantsearch 
				:application-id="$expected_payload['applicationId']" 
				:search-key="$expected_payload['searchKey']" 
				:index-name="$expected_payload['indexName']"
			></x-instantsearch>
		BLADE, ['expected_payload' => $expected_payload]);
		
		$result->assertSee('x-data="BladeAlpineInstantSearch($el', false);
		$result->assertSee(Js::from($expected_payload), false);
		$result->assertSee('var BladeAlpineInstantSearch', false);
	}
	
	public function test_it_renders_breadcrumbs(): void
	{
		$result = $this->blade('<x-instantsearch::breadcrumb />');
		
		$result->assertSee('x-data="BladeAlpineInstantSearch.widget($el, \'Breadcrumb\'', false);
		$result->assertSee('items:', false);
		$result->assertSee('canRefine:', false);
		$result->assertSee('refine:', false);
		$result->assertSee('createURL:', false);
		$result->assertSee('widgetParams:', false);
	}
	
	public function test_it_renders_clear_refinements(): void
	{
		$result = $this->blade('<x-instantsearch::clear-refinements />');
		
		$result->assertSee('x-data="BladeAlpineInstantSearch.widget($el, \'ClearRefinements\'', false);
		$result->assertSee('canRefine:', false);
		$result->assertSee('refine:', false);
		$result->assertSee('createURL:', false);
		$result->assertSee('widgetParams:', false);
	}
	
	public function test_it_renders_current_refinements(): void
	{
		$result = $this->blade('<x-instantsearch::current-refinements />');
		
		$result->assertSee('x-data="BladeAlpineInstantSearch.widget($el, \'CurrentRefinements\'', false);
		$result->assertSee('items:', false);
		$result->assertSee('canRefine:', false);
		$result->assertSee('refine:', false);
		$result->assertSee('createURL:', false);
		$result->assertSee('widgetParams:', false);
	}
}
