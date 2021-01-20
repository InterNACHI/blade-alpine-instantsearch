<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\HtmlString;
use Illuminate\View\Component;
use InterNACHI\BladeInstantSearch\BladeInstantSearch;

class InstantSearch extends Component
{
	public string $applicationId;
	
	public string $searchKey;
	
	public string $indexName;
	
	public array $widgets = [];
	
	protected BladeInstantSearch $helper;
	
	public function __construct(BladeInstantSearch $helper, $applicationId, $searchKey, $indexName)
	{
		$this->helper = $helper;
		
		$this->applicationId = (string) $applicationId;
		$this->searchKey = (string) $searchKey;
		
		$this->setIndexName($indexName);
	}
	
	public function addWidget($name, $id, array $config = []): self
	{
		$this->widgets[] = compact('name', 'id', 'config');
		
		return $this;
	}
	
	public function render()
	{
		return view('instantsearch::context');
	}
	
	public function resolveView()
	{
		$this->helper->pushContext($this);
		
		return fn($data) => tap($this->render()->with($data), fn() => $this->helper->popContext());
	}
	
	public function config(): HtmlString
	{
		$config = [
			'id' => $this->applicationId,
			'key' => $this->searchKey,
			'index' => $this->indexName,
			'widgets' => $this->widgets,
		];
		
		$json = collect($config)->toJson(JSON_THROW_ON_ERROR | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
		
		return new HtmlString(e($json));
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
	
	protected function setIndexName($indexName)
	{
		// If we're passed the fully-qualified class name of a model that implements
		// the Scout Searchable trait, we'll instantiate that model
		if (
			class_exists($indexName) 
			&& is_subclass_of($indexName, Model::class, true)
			&& method_exists($indexName, 'searchableAs')
		) {
			$indexName = new $indexName();
		}
		
		// If we have a Model that implements the Scout `searchableAs()` method, use that
		if ($indexName instanceof Model && method_exists($indexName, 'searchableAs')) {
			$indexName = $indexName->searchableAs();
		}
		
		$this->indexName = (string) $indexName;
	}
}
