<?php /** @var \Illuminate\View\ComponentAttributeBag $attributes */ ?>

<{{ $tagName }} 
	{{ $attributes->except('x-text') }} 
	x-html="instantsearch.snippet({ attribute: '{{ $attribute }}', hit })"></{{ $tagName }}>
