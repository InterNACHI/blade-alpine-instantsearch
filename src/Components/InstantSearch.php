<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\HtmlString;
use Illuminate\Support\Js;
use Illuminate\View\Component;
use InterNACHI\BladeInstantSearch\BladeInstantSearch;
use InvalidArgumentException;

class InstantSearch extends Component
{
	protected array $config;
	
	protected array $url_params = [];
	
	protected BladeInstantSearch $helper;
	
	public function __construct(
		BladeInstantSearch $helper,
		string $applicationId,
		string $searchKey,
		string $indexName,
		?string $numberLocale = null,
		$routing = null,
		$initialUiState = null,
		?int $stalledSearchDelay = null
	) {
		$this->helper = $helper;
		$this->helper->pushContext($this);
		
		$this->buildConfig(compact(
			'applicationId',
			'searchKey',
			'indexName',
			'numberLocale',
			'routing',
			'initialUiState',
			'stalledSearchDelay'
		));
	}
	
	public function render()
	{
		return function() {
			$this->helper->popContext();
			
			return view('instantsearch::context', [
				'config' => Js::from(collect($this->config)->put('routing', $this->routing())->filter()),
			]);
		};
	}
	
	public function addUrlParam(string $param, string $ui_state_key): void
	{
		$param_has_other_key = ($this->url_params[$param] ?? $ui_state_key) !== $ui_state_key;
		$key_has_other_param = (array_search($ui_state_key, $this->url_params) ?: $param) !== $param;
		
		if ($param_has_other_key || $key_has_other_param) {
			throw new InvalidArgumentException("The url-param [{$param}] conflicts with another url-param for [{$ui_state_key}].");
		}
		
		$this->url_params[$param] = $ui_state_key;
	}
	
	public function javascript(): HtmlString
	{
		// This let's us choose the correct pre-compiled JavaScript bundle depending
		// on the user's config (i.e. root-algolia-alpine.js if all bundling is enabled).
		$segments = [
			'root',
			config('instantsearch.bundle_algolia', true)
				? 'algolia'
				: null,
			config('instantsearch.bundle_alpine', true)
				? 'alpine'
				: null,
		];
		
		$filename = collect($segments)->filter()->implode('-');
		
		return new HtmlString('<script>'.file_get_contents($this->helper->path("js/dist/{$filename}.js")).'</script>');
	}
	
	protected function routing()
	{
		$routing = $this->config['routing'];
		
		if (false === $routing) {
			return null;
		}
		
		$url_params = is_array($routing)
			? array_merge(array_diff($this->url_params, $routing), $routing)
			: $this->url_params;
		
		return $url_params ?: $routing;
	}
	
	protected function buildConfig(array $config)
	{
		$config['indexName'] = $this->indexName($config['indexName']);
		
		$this->config = $config;
	}
	
	protected function indexName($input): string
	{
		if ($this->isSearchableModelClassName($input)) {
			$input = new $input();
		}
		
		if (method_exists($input, 'searchableAs')) {
			$input = $input->searchableAs();
		}
		
		return (string) $input;
	}
	
	protected function isSearchableModelClassName($input): bool
	{
		return class_exists($input)
			&& is_subclass_of($input, Model::class, true)
			&& method_exists($input, 'searchableAs');
	}
}
