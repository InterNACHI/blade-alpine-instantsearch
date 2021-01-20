<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\Container\Container;
use Illuminate\Support\HtmlString;
use Illuminate\Support\Str;
use Illuminate\View\Component;
use Illuminate\View\ComponentAttributeBag;
use InterNACHI\BladeInstantSearch\BladeInstantSearch;

abstract class Widget extends Component
{
	protected const JSON_FLAGS = JSON_THROW_ON_ERROR | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT;
	
	protected array $widget_config = [];
	
	public function resolveView()
	{
		if ($this->isRenderless()) {
			return view('instantsearch::connected-component');
		}
		
		return parent::resolveView();
	}
	
	public function render()
	{
		return view('instantsearch::connected-component');
	}
	
	protected function setWidgetData(array $data)
	{
		$this->widget_config = [
			'name' => class_basename($this),
			'config' => $data,
			'defaults' => $this->variableDefaults(),
		];
	}
	
	public function withAttributes(array $attributes)
	{
		$config = e(collect($this->widget_config)->toJson(static::JSON_FLAGS));
		
		$attributes = array_merge($attributes, [
			'x-data' => new HtmlString("BladeAlpineInstantSearch.widget('{$config}')"),
			'x-init' => 'init',
		]);
		
		return parent::withAttributes($attributes);
	}
	
	protected function variableDefaults(): array
	{
		return [];
	}
	
	protected function isRenderless(): bool
	{
		if (
			$this->attributes instanceof ComponentAttributeBag
			&& $this->attributes->has('renderless')
		) {
			return (bool) $this->attributes->get('renderless');
		}
		
		return config('instantsearch.renderless', false);
	}
	
	protected function currentContext() : InstantSearch
	{
		return Container::getInstance()
			->make(BladeInstantSearch::class)
			->currentContext();
	}
}
