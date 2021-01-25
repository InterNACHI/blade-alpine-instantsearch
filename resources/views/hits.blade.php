<?php /** @var \Illuminate\View\ComponentAttributeBag $attributes */ ?>

<div {{ $attributes }}>
	<template x-for="hit in hits" :key="hit.objectID">
		{{ $slot }}
	</template>
	
	@isset($empty)
		<div style="display: none;" x-show="!first_render && 0 === hits.length">
			{{ $empty }}
		</div>
	@endisset
</div>
