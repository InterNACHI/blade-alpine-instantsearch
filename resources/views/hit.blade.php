<?php /** @var \Illuminate\View\ComponentAttributeBag $attributes */ ?>

<{{ $tagName }} 
	{{ $attributes->except('x-text') }} 
	x-text="hit.{{ $attribute }}"
></{{ $tagName }}>
