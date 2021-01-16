<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\Container\Container;
use Illuminate\Support\HtmlString;
use Illuminate\View\Component;
use InterNACHI\BladeInstantSearch\Support\ContextStack;

abstract class ConnectedComponent extends Component
{
	public ?string $id = null;
	
	protected array $widgetData = [];
	
	public function resolveView()
	{
		$this->setId($this->id);
		
		$this->init($this->currentContext());
		
		return parent::resolveView();
	}
	
	public function render()
	{
		return view('instantsearch::connected-component');
	}
	
	public function widgetState(string $subkey = null, string $fallback = '{}'): HtmlString
	{
		return new HtmlString("getWidgetState('{$this->id}', '{$subkey}', {$fallback})");
		
		// return empty($subkey) 
		// 	? new HtmlString("('{$this->id}' in widgetState ? widgetState.{$this->id} : {$fallback})")
		// 	: new HtmlString("('{$this->id}' in widgetState && '{$subkey}' in widgetState.{$this->id}  ? widgetState.{$this->id}.{$subkey} : {$fallback})");
	}
	
	protected function setWidgetData(array $data)
	{
		$this->widgetData = $data;
		
		return $this;
	}
	
	protected function setId($id = null)
	{
		$this->id = (string) ($id ?? InstantSearch::generateId());
		
		return $this->id;
	}
	
	protected function init(InstantSearch $context)
	{
		$context->addWidget(
			class_basename($this),
			$this->id,
			$this->widgetData
		);
	}
	
	protected function currentContext() : InstantSearch
	{
		return Container::getInstance()
			->make(ContextStack::class)
			->current();
	}
}
