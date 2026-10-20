<?php

namespace InterNACHI\BladeInstantSearch\Tests\Feature;

use Illuminate\Support\Js;
use Illuminate\View\ViewException;
use InterNACHI\BladeInstantSearch\Tests\TestCase;

class UrlParamsTest extends TestCase
{
	public function test_it_maps_each_widget_to_its_url_param(): void
	{
		$result = $this->blade(<<<'BLADE'
			<x-instantsearch application-id="app" search-key="key" index-name="offers">
				<x-instantsearch::search-box url-param="search" />
				<x-instantsearch::menu attribute="category" url-param="category" />
				<x-instantsearch::refinement-list attribute="status" url-param="status" />
				<x-instantsearch::pagination url-param="page" />
			</x-instantsearch>
		BLADE);
		
		$result->assertSee($this->config([
			'search' => 'query',
			'category' => 'menu.category',
			'status' => 'refinementList.status',
			'page' => 'page',
		]), false);
		$result->assertDontSee('url-param=', false);
	}
	
	public function test_a_routing_array_overrides_a_widget_url_param(): void
	{
		$result = $this->blade(<<<'BLADE'
			<x-instantsearch application-id="app" search-key="key" index-name="offers" :routing="['q' => 'query']">
				<x-instantsearch::search-box url-param="search" />
				<x-instantsearch::pagination url-param="page" />
			</x-instantsearch>
		BLADE);
		
		$result->assertSee($this->config(['page' => 'page', 'q' => 'query']), false);
	}
	
	public function test_disabled_routing_ignores_url_params(): void
	{
		$result = $this->blade(<<<'BLADE'
			<x-instantsearch application-id="app" search-key="key" index-name="offers" :routing="false">
				<x-instantsearch::search-box url-param="search" />
			</x-instantsearch>
		BLADE);
		
		$result->assertSee($this->config(), false);
	}
	
	public function test_routing_without_url_params_keeps_the_default_urls(): void
	{
		$result = $this->blade(<<<'BLADE'
			<x-instantsearch application-id="app" search-key="key" index-name="offers" routing>
				<x-instantsearch::search-box />
			</x-instantsearch>
		BLADE);
		
		$result->assertSee($this->config(routing: true), false);
	}
	
	public function test_two_widgets_for_one_attribute_can_share_a_url_param(): void
	{
		$result = $this->blade(<<<'BLADE'
			<x-instantsearch application-id="app" search-key="key" index-name="offers">
				<x-instantsearch::refinement attribute="status" url-param="status">
					<x-instantsearch::refinement-list attribute="status" url-param="status" />
				</x-instantsearch::refinement>
			</x-instantsearch>
		BLADE);
		
		$result->assertSee($this->config(['status' => 'refinementList.status']), false);
	}
	
	public function test_it_rejects_two_url_params_for_one_attribute(): void
	{
		$this->expectException(ViewException::class);
		$this->expectExceptionMessageMatches('/conflicts with another url-param/');

		$this->blade(<<<'BLADE'
			<x-instantsearch application-id="app" search-key="key" index-name="offers">
				<x-instantsearch::refinement attribute="status" url-param="status">
					<x-instantsearch::refinement-list attribute="status" url-param="progress" />
				</x-instantsearch::refinement>
			</x-instantsearch>
		BLADE);
	}
	
	public function test_each_search_keeps_its_own_url_params(): void
	{
		$result = $this->blade(<<<'BLADE'
			<x-instantsearch application-id="app" search-key="key" index-name="offers">
				<x-instantsearch::search-box url-param="search" />
			</x-instantsearch>
			<x-instantsearch application-id="app" search-key="key" index-name="offers">
				<x-instantsearch::pagination url-param="page" />
			</x-instantsearch>
		BLADE);
		
		$result->assertSee($this->config(['search' => 'query']), false);
		$result->assertSee($this->config(['page' => 'page']), false);
	}
	
	protected function config($routing = null): Js
	{
		return Js::from(array_filter([
			'applicationId' => 'app',
			'searchKey' => 'key',
			'indexName' => 'offers',
			'routing' => $routing,
		]));
	}
}
