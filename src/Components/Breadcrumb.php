<?php

namespace InterNACHI\BladeInstantSearch\Components;

class Breadcrumb extends Widget
{
	public function __construct(
		?array $attributes = null,
		?string $rootPath = null,
		?string $separator = null,
		?string $id = null
	) {
		$this->setId($id);
		$this->setWidgetData(array_filter(compact(
			'attributes',
			'rootPath',
			'separator'
		)));
	}
	
	public function render()
	{
		return view('instantsearch::breadcrumb');
	}
}