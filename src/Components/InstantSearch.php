<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\HtmlString;
use Illuminate\Support\Js;
use Illuminate\View\Component;
use InterNACHI\BladeInstantSearch\BladeInstantSearch;

class InstantSearch extends Component
{
	public Js $config;
	
	protected BladeInstantSearch $helper;
	
	public function __construct(
		BladeInstantSearch $helper,
		string $applicationId,
		string $searchKey,
		string $indexName,
		?string $numberLocale = null,
		?bool $routing = null,
		$initialUiState = null,
		?int $stalledSearchDelay = null
	) {
		$this->helper = $helper;
		
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
		return view('instantsearch::context');
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
	
	protected function buildConfig(array $config)
	{
		$config['indexName'] = $this->indexName($config['indexName']);
		
		$this->config = Js::from(collect($config)->filter());
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
	
	protected function isSearchableModelClassName($input) : bool
	{
		return class_exists($input)
			&& is_subclass_of($input, Model::class, true)
			&& method_exists($input, 'searchableAs');
	}
}
