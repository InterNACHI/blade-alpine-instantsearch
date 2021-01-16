<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\Support\HtmlString;
use Illuminate\View\Component;
use InterNACHI\BladeInstantSearch\Support\ContextStack;

class InstantSearch extends Component
{
	protected static int $autoId = 0;
	
	public string $applicationId;
	
	public string $searchKey;
	
	public string $indexName;
	
	public array $widgets = [];
	
	protected ContextStack $stack;
	
	public static function generateId(): string
	{
		return '__blade_alpine_instantsearch_'.static::$autoId++;
	}
	
	public function __construct(ContextStack $stack, $applicationId, $searchKey, $indexName)
	{
		$this->stack = $stack;
		
		$this->applicationId = (string) $applicationId;
		$this->searchKey = (string) $searchKey;
		$this->indexName = (string) $indexName;
	}
	
	public function addWidget($name, $id, array $config = []): self
	{
		$this->widgets[] = compact('name', 'id', 'config');
		
		return $this;
	}
	
	public function render()
	{
		return view('instantsearch::context', [
			'config' => $this->serializeConfig(),
		]);
	}
	
	public function resolveView()
	{
		$this->stack->push($this);
		
		return fn($data) => tap($this->render()->with($data), fn() => $this->stack->pop());
	}
	
	protected function serializeConfig(): HtmlString
	{
		$config = [
			'id' => $this->applicationId,
			'key' => $this->searchKey,
			'index' => $this->indexName,
			'widgets' => $this->widgets,
		];
		
		return new HtmlString(e(json_encode($config, JSON_THROW_ON_ERROR | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT)));
	}
}
