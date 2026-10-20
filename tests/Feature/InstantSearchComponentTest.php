<?php

namespace InterNACHI\BladeInstantSearch\Tests\Feature;

use Illuminate\Support\Js;
use InterNACHI\BladeInstantSearch\Facades\BladeInstantSearch;
use InterNACHI\BladeInstantSearch\Tests\Fixtures\SearchableProduct;
use InterNACHI\BladeInstantSearch\Tests\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;

class InstantSearchComponentTest extends TestCase
{
	public function test_it_passes_all_options_to_javascript(): void
	{
		$result = $this->blade(<<<'BLADE'
			<x-instantsearch
				application-id="APP"
				search-key="KEY"
				index-name="products"
				number-locale="de"
				routing
				:initial-ui-state="['products' => ['query' => 'phone']]"
				:stalled-search-delay="500"
			>
				<p>Content</p>
			</x-instantsearch>
		BLADE);
		
		$config = Js::from([
			'applicationId' => 'APP',
			'searchKey' => 'KEY',
			'indexName' => 'products',
			'numberLocale' => 'de',
			'routing' => true,
			'initialUiState' => ['products' => ['query' => 'phone']],
			'stalledSearchDelay' => 500,
		]);
		
		$result->assertSee("<div x-data=\"BladeAlpineInstantSearch(\$el, {$config})\">", false);
		$result->assertSee('<p>Content</p>', false);
	}
	
	public function test_empty_options_are_omitted(): void
	{
		$this->blade('<x-instantsearch application-id="APP" search-key="KEY" index-name="products" :routing="false" />')
			->assertSee('BladeAlpineInstantSearch($el, '.Js::from(['applicationId' => 'APP', 'searchKey' => 'KEY', 'indexName' => 'products']).')', false);
	}
	
	public function test_index_name_can_be_a_searchable_model_class(): void
	{
		$this->blade('<x-instantsearch application-id="APP" search-key="KEY" :index-name="$model" />', ['model' => SearchableProduct::class])
			->assertSee(Js::from(['applicationId' => 'APP', 'searchKey' => 'KEY', 'indexName' => 'products_index']), false);
	}
	
	public static function bundleProvider(): array
	{
		return [
			'everything bundled' => [true, true, 'root-algolia-alpine.js'],
			'algolia only' => [true, false, 'root-algolia.js'],
			'alpine only' => [false, true, 'root-alpine.js'],
			'nothing bundled' => [false, false, 'root.js'],
		];
	}
	
	#[DataProvider('bundleProvider')]
	public function test_it_includes_the_correct_javascript_bundle(bool $algolia, bool $alpine, string $expected): void
	{
		config([
			'instantsearch.bundle_algolia' => $algolia,
			'instantsearch.bundle_alpine' => $alpine,
		]);
		
		$result = (string) $this->blade('<x-instantsearch application-id="APP" search-key="KEY" index-name="products" />');
		
		$script = file_get_contents(BladeInstantSearch::path("js/dist/{$expected}"));
		
		$this->assertStringContainsString('<script>'.$script.'</script>', $result);
	}
	
	public function test_javascript_is_only_included_once_per_request(): void
	{
		$result = (string) $this->blade(<<<'BLADE'
			<x-instantsearch application-id="APP" search-key="KEY" index-name="one" />
			<x-instantsearch application-id="APP" search-key="KEY" index-name="two" />
		BLADE);
		
		$this->assertSame(2, substr_count($result, 'x-data="BladeAlpineInstantSearch($el'));
		$this->assertSame(1, substr_count($result, file_get_contents(BladeInstantSearch::path('js/dist/root-algolia-alpine.js'))));
	}
	
	public function test_widgets_render_inside_the_root_component(): void
	{
		$result = (string) $this->blade(<<<'BLADE'
			<x-instantsearch application-id="APP" search-key="KEY" index-name="products">
				<x-instantsearch::search-box />
				<x-instantsearch::hits>
					<x-instantsearch::highlight attribute="name" />
				</x-instantsearch::hits>
			</x-instantsearch>
		BLADE);
		
		$root = strpos($result, 'BladeAlpineInstantSearch($el');
		$search_box = strpos($result, "BladeAlpineInstantSearch.widget(\$el, 'SearchBox'");
		$hits = strpos($result, "BladeAlpineInstantSearch.widget(\$el, 'Hits'");
		
		$this->assertNotFalse($root);
		$this->assertGreaterThan($root, $search_box);
		$this->assertGreaterThan($search_box, $hits);
	}
}
