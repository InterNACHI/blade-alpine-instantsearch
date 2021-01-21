<?php /** @var \Illuminate\View\ComponentAttributeBag $attributes */ ?>

<div {{ $attributes }}>
	<template x-for="hit in hits" :key="hit.objectID">
		{{ $slot }}
	</template>
</div>
