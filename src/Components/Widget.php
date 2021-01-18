<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\Container\Container;
use Illuminate\Support\HtmlString;
use Illuminate\Support\Str;
use Illuminate\View\Component;
use InterNACHI\BladeInstantSearch\BladeInstantSearch;

abstract class Widget extends Component
{
	protected static $id_map = [];
	
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
	}
	
	protected function setWidgetData(array $data)
	{
		$this->widgetData = $data;
		
		return $this;
	}
	
	protected function setId($id = null)
	{
		if (null === $id) {
			$prefix = Str::kebab(class_basename($this));
			$suffix = static::$id_map[$prefix] ??= 1;
			$id = $prefix.$suffix;
			static::$id_map[$prefix]++;
		}
		
		$this->id = (string) $id;
		
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
			->make(BladeInstantSearch::class)
			->currentContext();
	}
}
