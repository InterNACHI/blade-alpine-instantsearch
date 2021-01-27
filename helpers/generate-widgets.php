#!/usr/bin/env php
<?php

use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

require __DIR__.'/../vendor/autoload.php';

$definitions = <<<JS
instantsearch.widgets.searchBox({
  container: string|HTMLElement,
  // Optional parameters
  placeholder: string,
  autofocus: boolean,
  searchAsYouType: boolean,
  showReset: boolean,
  showSubmit: boolean,
  showLoadingIndicator: boolean,
  queryHook: function,
  templates: object,
  cssClasses: object,
});
instantsearch.widgets.hits({
  container: string|HTMLElement,
  // Optional parameters
  escapeHTML: boolean,
  templates: object,
  cssClasses: object,
  transformItems: function,
});
instantsearch.widgets.refinementList({
  container: string|HTMLElement,
  attribute: string,
  // Optional parameters
  operator: string,
  limit: number,
  showMore: boolean,
  showMoreLimit: number,
  searchable: boolean,
  searchablePlaceholder: string,
  searchableIsAlwaysActive: boolean,
  searchableEscapeFacetValues: boolean,
  sortBy: string[]|function,
  templates: object,
  cssClasses: object,
  transformItems: function,
});
instantsearch.widgets.hierarchicalMenu({
  container: string|HTMLElement,
  attributes: string[],
  // Optional parameters
  limit: number,
  showMore: boolean,
  showMoreLimit: number,
  separator: string,
  rootPath: string,
  showParentLevel: boolean,
  sortBy: string[]|function,
  templates: object,
  cssClasses: object,
  transformItems: function,
});
instantsearch.widgets.rangeSlider({
  container: string|HTMLElement,
  attribute: string,
  // Optional parameters
  min: number,
  max: number,
  precision: number,
  step: number,
  pips: boolean,
  tooltips: boolean|object,
  cssClasses: object,
});
instantsearch.widgets.menu({
  container: string|HTMLElement,
  attribute: string,
  // Optional parameters
  limit: number,
  showMore: boolean,
  showMoreLimit: number,
  sortBy: string[]|function,
  templates: object,
  cssClasses: object,
  transformItems: function,
});
instantsearch.widgets.currentRefinements({
  container: string|HTMLElement,
  // Optional parameters
  includedAttributes: string[],
  excludedAttributes: string[],
  cssClasses: object,
  transformItems: function,
});
instantsearch.widgets.rangeInput({
  container: string|HTMLElement,
  attribute: string,
  // Optional parameters
  min: number,
  max: number,
  precision: number,
  templates: object,
  cssClasses: object,
});
instantsearch.widgets.menuSelect({
  container: string|HTMLElement,
  attribute: string,
  // Optional parameters
  limit: number,
  sortBy: string[]|function,
  templates: object,
  cssClasses: object,
  transformItems: function,
});
instantsearch.widgets.toggleRefinement({
  container: string|HTMLElement,
  attribute: string,
  // Optional parameters
  on: boolean|number|string,
  off: boolean|number|string,
  templates: object,
  cssClasses: object,
});
instantsearch.widgets.numericMenu({
  container: string|HTMLElement,
  attribute: string,
  items: object[],
  // Optional parameters
  templates: object,
  cssClasses: object,
  transformItems: function,
});
instantsearch.widgets.ratingMenu({
  container: string|HTMLElement,
  attribute: string,
  // Optional parameters
  max: number,
  templates: object,
  cssClasses: object,
});
instantsearch.widgets.clearRefinements({
  container: string|HTMLElement,
  // Optional parameters
  includedAttributes: string[],
  excludedAttributes: string[],
  templates: object,
  cssClasses: object,
  transformItems: function,
});
instantsearch.widgets.pagination({
  container: string|HTMLElement,
  // Optional parameters
  showFirst: boolean,
  showPrevious: boolean,
  showNext: boolean,
  showLast: boolean,
  padding: number,
  totalPages: number,
  scrollTo: string|HTMLElement|boolean,
  templates: object,
  cssClasses: object,
});
instantsearch.widgets.breadcrumb({
  container: string|HTMLElement,
  attributes: string[],
  // Optional parameters
  rootPath: string,
  separator: string,
  templates: object,
  cssClasses: object,
  transformItems: function,
});
instantsearch.widgets.sortBy({
  container: string|HTMLElement,
  items: object[],
  // Optional parameters
  cssClasses: object,
  transformItems: function,
});
JS;

preg_match_all('/instantsearch.widgets.([^(]+)\({(.*?)}\);/s', $definitions, $matches);

$config = collect($matches[1])
	->combine($matches[2])
	->mapWithKeys(fn($value, $key) => [ucfirst($key) => $value])
	->map(function($definition) {
		preg_match_all('/^\s*(?P<argument>[a-z0-9]+):\s*(?P<type>.*?),/im', $definition, $matches);
		return collect($matches['argument'])
			->combine($matches['type'])
			->map(fn($type) => Str::of($type))
			->map(function(Stringable $type) {
				// Skip types that are incompatible with the PHP implementation
				if ($type->contains(['HTMLElement', 'object', 'function'])) {
					return null;
				}
				
				if ($type->endsWith('[]')) {
					return '?array';
				}
				
				$map = [
					'string' => '?string',
					'number' => '?int',
					'boolean' => '?bool',
				];
				
				return $map[(string) $type];
			})
			->filter();
	})
	->each(function(Collection $arguments, string $name) {
		$constructor_arguments = $arguments
			->map(fn($type, $name) => "{$type} \${$name} = null")
			->implode(",\n\t\t");
		
		$compact_lines = $arguments
			->map(fn($type, $name) => "'{$name}'")
			->implode(",\n\t\t\t");
		
		$view = Str::kebab($name);
		
		$generated_class = <<<PHP
		<?php
		
		namespace InterNACHI\BladeInstantSearch\Components;
		
		class {$name} extends Widget
		{
			public function __construct(
				{$constructor_arguments}
			) {
				\$this->setWidgetData(array_filter(compact(
					{$compact_lines}
				)));
			}
			
			public function render()
			{
				return view('instantsearch::{$view}');
			}
		}
		PHP;
		
		$view_hints = $arguments
			->map(fn($type, $name) => "{{-- {$name} ({$type}) --}}")
			->implode("\n");
		
		$generated_view = <<<HTML
		<div id="{{ \$id }}">
			{{ \$slot }}
		</div>
		
		{$view_hints}
		HTML;
		
		$class_file = realpath(__DIR__.'/../src/Components').'/'.$name.'.php';
		$view_file = realpath(__DIR__.'/../resources/views').'/'.$view.'.blade.php';
		
		if (file_exists($class_file)) {
			echo "SKIPPING: $name\n\n$generated_class\n\n";
		} else {
			file_put_contents($class_file, $generated_class);
		}
		
		if (!file_exists($view_file)) {
			file_put_contents($view_file, $generated_view);
		}
	});
