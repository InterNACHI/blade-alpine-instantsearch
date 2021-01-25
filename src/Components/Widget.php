<?php

namespace InterNACHI\BladeInstantSearch\Components;

use Illuminate\Contracts\View\View as ViewContract;
use Illuminate\Support\HtmlString;
use Illuminate\View\Component;
use Illuminate\View\ComponentAttributeBag;

abstract class Widget extends Component
{
	protected const JSON_FLAGS = JSON_THROW_ON_ERROR | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT;
	
	protected array $widget_config = [];
	
	public function resolveView()
	{
		return function($data) {
			$view = $this->isRenderless()
				? view('instantsearch::connected-component')
				: $this->render();
			
			return $view->with($data);
		};
	}
	
	public function render()
	{
		return view('instantsearch::connected-component');
	}
	
	public function withAttributes(array $attributes)
	{
		$name = $this->widgetName();
		$config = e(collect($this->widget_config)->toJson(static::JSON_FLAGS));
		$defaults = $this->widgetDefaults();
		
		$attributes = array_merge($attributes, [
			'x-data' => new HtmlString("BladeAlpineInstantSearch.widget(\$el, '{$name}', '{$config}', {$defaults})"),
			'x-init' => 'init',
		]);
		
		return parent::withAttributes($attributes);
	}
	
	protected function setWidgetData(array $data)
	{
		$this->widget_config = $data;
	}
	
	protected function widgetDefaults() : string
	{
		return '{}';
	}
	
	protected function widgetName(): string
	{
		return class_basename($this);
	}
	
	protected function isRenderless() : bool
	{
		return $this->renderlessAttribute() ?? config('instantsearch.renderless', false);
	}
	
	protected function renderlessAttribute() : ?bool
	{
		if (!($this->attributes instanceof ComponentAttributeBag)) {
			return null;
		}
		
		if (!$this->attributes->has('renderless')) {
			return null;
		}
		
		return (bool) $this->attributes->get('renderless');
	}
}
