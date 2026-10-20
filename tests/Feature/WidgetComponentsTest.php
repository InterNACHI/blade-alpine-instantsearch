<?php

namespace InterNACHI\BladeInstantSearch\Tests\Feature;

use Illuminate\Support\Js;
use InterNACHI\BladeInstantSearch\Components\Widget;
use InterNACHI\BladeInstantSearch\Tests\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use ReflectionClass;

class WidgetComponentsTest extends TestCase
{
	public static function widgetProvider(): array
	{
		return [
			'breadcrumb' => [
				'<x-instantsearch::breadcrumb :attributes="[\'lvl0\', \'lvl1\']" root-path="Root" separator=" / " />',
				'Breadcrumb',
				['attributes' => ['lvl0', 'lvl1'], 'rootPath' => 'Root', 'separator' => ' / '],
				'{ items: [], canRefine: false, refine: null, createURL: null, widgetParams: {} }',
			],
			'clear-refinements' => [
				'<x-instantsearch::clear-refinements :included-attributes="[\'brand\']" :excluded-attributes="[\'query\']" />',
				'ClearRefinements',
				['includedAttributes' => ['brand'], 'excludedAttributes' => ['query']],
				'{ canRefine: false, refine: null, createURL: null, widgetParams: {} }',
			],
			'current-refinements' => [
				'<x-instantsearch::current-refinements :included-attributes="[\'brand\']" :excluded-attributes="[\'query\']" />',
				'CurrentRefinements',
				['includedAttributes' => ['brand'], 'excludedAttributes' => ['query']],
				'{ items: [], canRefine: false, refine: null, createURL: null, widgetParams: {} }',
			],
			'hierarchical-menu' => [
				'<x-instantsearch::hierarchical-menu :attributes="[\'lvl0\', \'lvl1\']" :limit="5" show-more :show-more-limit="20" separator=" > " root-path="Root" show-parent-level />',
				'HierarchicalMenu',
				['attributes' => ['lvl0', 'lvl1'], 'limit' => 5, 'showMore' => true, 'showMoreLimit' => 20, 'separator' => ' > ', 'rootPath' => 'Root', 'showParentLevel' => true],
				'{ items: [], isShowingMore: false, canToggleShowMore: false, canRefine: false, refine: null, sendEvent: null, toggleShowMore: null, createURL: null, widgetParams: {} }',
			],
			'hits' => [
				'<x-instantsearch::hits escape-h-t-m-l />',
				'Hits',
				['escapeHTML' => true],
				'{ hits: [], results: {}, sendEvent: null, widgetParams: null }',
			],
			'menu' => [
				'<x-instantsearch::menu attribute="category" :limit="5" show-more :show-more-limit="10" />',
				'Menu',
				['attribute' => 'category', 'limit' => 5, 'showMore' => true, 'showMoreLimit' => 10],
				'{ items: [], canRefine: false, isShowingMore: false, canToggleShowMore: false, refine: null, sendEvent: null, createURL: null, toggleShowMore: null, widgetParams: {} }',
			],
			'menu-select' => [
				'<x-instantsearch::menu-select attribute="category" :limit="5" />',
				'Menu',
				['attribute' => 'category', 'limit' => 5],
				'{ items: [], canRefine: false, refine: null, sendEvent: null, widgetParams: {} }',
			],
			'numeric-menu' => [
				'<x-instantsearch::numeric-menu attribute="price" :items="[[\'label\' => \'All\'], [\'label\' => \'Cheap\', \'end\' => 10]]" />',
				'NumericMenu',
				['attribute' => 'price', 'items' => [['label' => 'All'], ['label' => 'Cheap', 'end' => 10]]],
				'{ items: [], hasNoResults: true, refine: null, sendEvent: null, createURL: null, widgetParams: {} }',
			],
			'pagination' => [
				'<x-instantsearch::pagination show-first show-previous show-next show-last :padding="2" :total-pages="10" />',
				'Pagination',
				['showFirst' => true, 'showPrevious' => true, 'showNext' => true, 'showLast' => true, 'padding' => 2, 'totalPages' => 10],
				'{ pages: [], currentRefinement: 0, nbHits: 0, nbPages: 0, isFirstPage: true, isLastPage: false, canRefine: false, refine: null, createURL: null, widgetParams: null }',
			],
			'range-input' => [
				'<x-instantsearch::range-input attribute="price" :min="1" :max="100" :precision="2" />',
				'Range',
				['attribute' => 'price', 'min' => 1, 'max' => 100, 'precision' => 2],
				'{ start: [], range: {}, canRefine: false, refine: null, sendEvent: null, widgetParams: {} }',
			],
			'range-slider' => [
				'<x-instantsearch::range-slider attribute="price" :min="1" :max="100" :precision="2" :step="5" pips />',
				'Range',
				['attribute' => 'price', 'min' => 1, 'max' => 100, 'precision' => 2, 'step' => 5, 'pips' => true],
				'{ start: [], range: {}, canRefine: false, refine: null, sendEvent: null, widgetParams: {} }',
			],
			'rating-menu' => [
				'<x-instantsearch::rating-menu attribute="rating" :max="5" />',
				'RatingMenu',
				['attribute' => 'rating', 'max' => 5],
				'{ items: [], hasNoResults: true, canRefine: false, refine: null, sendEvent: null, createURL: null, widgetParams: {} }',
			],
			'refinement' => [
				'<x-instantsearch::refinement attribute="brand" id="brands" />',
				'RefinementList',
				['id' => 'brands', 'attribute' => 'brand', 'operator' => 'or', 'limit' => 10, 'searchablePlaceholder' => 'Search…', 'searchableIsAlwaysActive' => true, 'searchableEscapeFacetValues' => true],
				'{ items: [], canRefine: false, refine: null, sendEvent: null, createURL: null, isFromSearch: false, searchForItems: null, isShowingMore: false, canToggleShowMore: false, toggleShowMore: null, widgetParams: {} }',
			],
			'refinement-list' => [
				'<x-instantsearch::refinement-list attribute="brand" id="brands" operator="and" :limit="5" show-more :show-more-limit="20" searchable searchable-placeholder="Find…" :searchable-is-always-active="false" :searchable-escape-facet-values="false" :sort-by="[\'count:desc\']" />',
				'RefinementList',
				['id' => 'brands', 'attribute' => 'brand', 'operator' => 'and', 'limit' => 5, 'showMore' => true, 'showMoreLimit' => 20, 'searchable' => true, 'searchablePlaceholder' => 'Find…', 'sortBy' => ['count:desc']],
				'{ items: [], canRefine: false, refine: null, sendEvent: null, createURL: null, isFromSearch: false, searchForItems: null, isShowingMore: false, canToggleShowMore: false, toggleShowMore: null, widgetParams: {} }',
			],
			'search-box' => [
				'<x-instantsearch::search-box search-as-you-type show-reset show-submit show-loading-indicator />',
				'SearchBox',
				['searchAsYouType' => true, 'showReset' => true, 'showSubmit' => true, 'showLoadingIndicator' => true],
				"{ query: '', refine: null, clear: null, isSearchStalled: false, widgetParams: {} }",
			],
			'sort-by' => [
				'<x-instantsearch::sort-by />',
				'SortBy',
				[],
				"{ options: [], currentRefinement: '', hasNoResults: false, refine: null, widgetParams: {} }",
			],
			'toggle-refinement' => [
				'<x-instantsearch::toggle-refinement attribute="free_shipping" />',
				'ToggleRefinement',
				['attribute' => 'free_shipping'],
				'{ value: {}, canRefine: false, refine: null, sendEvent: null, createURL: null, widgetParams: {} }',
			],
		];
	}
	
	#[DataProvider('widgetProvider')]
	public function test_widgets_bind_to_their_instantsearch_connector(string $blade, string $name, array $config, string $defaults): void
	{
		$this->blade($blade)->assertSee($this->expectedXData($name, $config, $defaults), false);
	}
	
	public function test_falsy_widget_options_are_not_sent_to_the_connector(): void
	{
		$this->blade('<x-instantsearch::menu attribute="category" :limit="0" :show-more="false" />')
			->assertSee($this->expectedXData('Menu', ['attribute' => 'category'], '{ items: [], canRefine: false, isShowingMore: false, canToggleShowMore: false, refine: null, sendEvent: null, createURL: null, toggleShowMore: null, widgetParams: {} }'), false);
	}
	
	public function test_widgets_without_options_send_an_empty_array(): void
	{
		$this->blade('<x-instantsearch::hits />')
			->assertSee("BladeAlpineInstantSearch.widget(\$el, 'Hits', [], ", false);
	}
	
	public function test_extra_attributes_are_passed_through_to_the_widget_element(): void
	{
		$this->blade('<x-instantsearch::menu attribute="category" class="my-menu" data-foo="bar">Menu</x-instantsearch::menu>')
			->assertSee('class="my-menu"', false)
			->assertSee('data-foo="bar"', false)
			->assertSee('Menu');
	}
	
	public function test_package_x_data_takes_precedence_over_user_x_data(): void
	{
		$this->blade('<x-instantsearch::menu attribute="category" x-data="{ mine: true }" />')
			->assertDontSee('mine: true', false)
			->assertSee("x-data=\"BladeAlpineInstantSearch.widget(\$el, 'Menu'", false);
	}
	
	public function test_renderless_attribute_skips_the_packaged_template(): void
	{
		$result = $this->blade('<x-instantsearch::pagination renderless><span>Custom</span></x-instantsearch::pagination>');
		
		$result->assertSee("x-data=\"BladeAlpineInstantSearch.widget(\$el, 'Pagination'", false);
		$result->assertSee('<span>Custom</span>', false);
		$result->assertDontSee('aria-label="Pagination"', false);
	}
	
	public function test_renderless_config_skips_the_packaged_template(): void
	{
		config(['instantsearch.renderless' => true]);
		
		$result = $this->blade('<x-instantsearch::pagination><span>Custom</span></x-instantsearch::pagination>');
		
		$result->assertSee('<span>Custom</span>', false);
		$result->assertDontSee('aria-label="Pagination"', false);
	}
	
	public function test_renderless_attribute_can_override_config(): void
	{
		config(['instantsearch.renderless' => true]);
		
		$this->blade('<x-instantsearch::pagination :renderless="false" />')
			->assertSee('aria-label="Pagination"', false);
	}
	
	public function test_packaged_templates_are_used_by_default(): void
	{
		$this->blade('<x-instantsearch::pagination />')
			->assertSee('aria-label="Pagination"', false)
			->assertSee('x-text="nbPages"', false);
	}
	
	public function test_search_box_puts_alpine_state_on_wrapper_and_attributes_on_input(): void
	{
		$result = $this->blade('<x-instantsearch::search-box placeholder="Find stuff" autofocus />');
		
		$result->assertSee("<div x-data=\"BladeAlpineInstantSearch.widget(\$el, 'SearchBox'", false);
		$result->assertSee('placeholder="Find stuff"', false);
		$result->assertSee('autofocus="autofocus"', false);
		$result->assertSee('x-model="query"', false);
		$result->assertSee('@input="refine(query)"', false);
		$result->assertSee(':class="{ hidden: !isSearchStalled }"', false);
	}
	
	public function test_hits_render_slot_in_a_loop_and_optional_empty_state(): void
	{
		$result = $this->blade('<x-instantsearch::hits><div class="hit">x</div><x-slot:empty>Nothing found</x-slot:empty></x-instantsearch::hits>');
		
		$result->assertSee('<template x-for="hit in hits" :key="hit.objectID">', false);
		$result->assertSee('<div class="hit">x</div>', false);
		$result->assertSee('x-show="!isFirstRender && 0 === hits.length"', false);
		$result->assertSee('Nothing found');
		
		$this->blade('<x-instantsearch::hits><div>x</div></x-instantsearch::hits>')
			->assertDontSee('isFirstRender', false);
	}
	
	public function test_refinement_list_template(): void
	{
		$result = $this->blade('<x-instantsearch::refinement-list attribute="brand" id="brands" />');
		
		$result->assertSee('<template x-for="item in items" :key="item.value">', false);
		$result->assertSee(':id="\'brands\' + \'_\' + item.value"', false);
		$result->assertSee('@change="refine(item.value)"', false);
		$result->assertSee('x-text="item.count.toLocaleString()"', false);
		$result->assertDontSee('toggleShowMore()', false);
		
		$this->blade('<x-instantsearch::refinement-list attribute="brand" show-more />')
			->assertSee('@click.prevent="toggleShowMore()"', false);
	}
	
	public function test_refinement_list_generates_an_id_when_none_is_given(): void
	{
		$result = (string) $this->blade('<x-instantsearch::refinement-list attribute="brand" />');
		
		$this->assertMatchesRegularExpression("/:id=\"'([A-Za-z0-9]{16})' \\+ '_' \\+ item.value\"/", $result);
		// The generated ID is only used by the template, not sent to the connector
		$this->assertStringNotContainsString('\\u0022id\\u0022', $result);
	}
	
	public function test_refinement_template_hides_when_there_are_no_items(): void
	{
		$this->blade('<x-instantsearch::refinement attribute="brand" x-show="false">Brands</x-instantsearch::refinement>')
			->assertSee('x-show="items.length > 0"', false)
			->assertDontSee('x-show="false"', false)
			->assertSee('Brands');
	}
	
	public function test_numeric_menu_template(): void
	{
		$this->blade('<x-instantsearch::numeric-menu attribute="price" :items="[]" />')
			->assertSee('<ul', false)
			->assertSee('@change="refine($event.target.value)"', false);
	}
	
	public function test_clear_refinements_template(): void
	{
		$this->blade('<x-instantsearch::clear-refinements />')
			->assertSee('<button', false)
			->assertSee('x-show.important="canRefine"', false)
			->assertSee('@click="refine()"', false)
			->assertSee('Clear Refinements');
		
		$this->blade('<x-instantsearch::clear-refinements>Reset</x-instantsearch::clear-refinements>')
			->assertSee('Reset')
			->assertDontSee('Clear Refinements');
	}
	
	public function test_stub_templates_render_their_slot(): void
	{
		foreach (['breadcrumb', 'current-refinements', 'hierarchical-menu', 'menu', 'menu-select', 'range-input', 'range-slider', 'rating-menu', 'sort-by', 'toggle-refinement'] as $widget) {
			$this->blade("<x-instantsearch::{$widget}><p>Slot for {$widget}</p></x-instantsearch::{$widget}>")
				->assertSee("<p>Slot for {$widget}</p>", false);
		}
	}
	
	public function test_hit_component(): void
	{
		$this->blade('<x-instantsearch::hit attribute="name" class="font-bold" />')
			->assertSee('<span', false)
			->assertSee('class="font-bold"', false)
			->assertSee('x-text="hit.name"', false);
		
		$this->blade('<x-instantsearch::hit attribute="name" tag-name="h2" x-text="nope" />')
			->assertSee('<h2', false)
			->assertSee('</h2>', false)
			->assertDontSee('nope');
	}
	
	public function test_highlight_component(): void
	{
		$this->blade('<x-instantsearch::highlight attribute="name" />')
			->assertSee('<div', false)
			->assertSee('x-html="hit._highlightResult.name.value || hit.name"', false);
		
		$this->blade('<x-instantsearch::highlight attribute="name" tag-name="p" x-html="nope" />')
			->assertSee('<p', false)
			->assertDontSee('nope');
	}
	
	public function test_snippet_component(): void
	{
		$this->blade('<x-instantsearch::snippet attribute="description" />')
			->assertSee('<span', false)
			->assertSee('x-html="instantsearch.snippet({ attribute: \'description\', hit })"', false);
		
		$this->blade('<x-instantsearch::snippet attribute="description" tag-name="p" />')
			->assertSee('<p', false);
	}
	
	public function test_widgets_do_not_create_dynamic_properties(): void
	{
		set_error_handler(fn(int $level, string $message) => $this->fail($message), E_DEPRECATED);
		
		try {
			foreach (glob(dirname(__DIR__, 2).'/src/Components/*.php') as $file) {
				$class = 'InterNACHI\\BladeInstantSearch\\Components\\'.basename($file, '.php');
				
				if (is_subclass_of($class, Widget::class) && ! (new ReflectionClass($class))->isAbstract()) {
					$widget = $this->app->make($class, ['attribute' => 'brand', 'items' => [], 'id' => 'widget-id']);
					$widget->setId('another-id');
					$this->assertSame('another-id', $widget->id);
				}
			}
		} finally {
			restore_error_handler();
		}
	}
	
	protected function expectedXData(string $name, array $config, string $defaults): string
	{
		$config = Js::from($config);
		
		return "x-data=\"BladeAlpineInstantSearch.widget(\$el, '{$name}', {$config}, {$defaults})\"";
	}
}
