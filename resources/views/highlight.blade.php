<?php /** @var \Illuminate\View\ComponentAttributeBag $attributes */ ?>

<{{ $tagName }} 
	{{ $attributes->except('x-html') }} 
	x-html="hit._highlightResult.{{ $attribute }}.value || hit.{{ $attribute }}"
></{{ $tagName }}>
