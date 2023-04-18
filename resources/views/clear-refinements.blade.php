<?php /** @var \Illuminate\View\ComponentAttributeBag $attributes */ ?>

<button
	{{ $attributes->merge([
		'class'=> 'block w-full px-2 py-1 rounded border border-gray-300 bg-white text-sm font-medium hover:bg-gray-100 text-gray-500 cursor-pointer'
	]) }}
	x-show.important="canRefine"
	@click="refine()"
>
	{{ $slot->isNotEmpty() ? $slot : 'Clear Refinements' }}
</button>