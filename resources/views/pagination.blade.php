<?php /** @var \Illuminate\View\ComponentAttributeBag $attributes */ ?>

<div {{ $attributes->merge(['class' => 'relative z-0 inline-flex space-x-4 items-center']) }}>
	
	<span class="text-sm">
		Page <b x-text="currentRefinement + 1"></b>
		of <b x-text="nbPages"></b>
	</span>
	
	<nav class="relative inline-flex shadow-sm -space-x-px" aria-label="Pagination">
		<button
			@click.prevent="if (!isFirstPage) refine(currentRefinement - 1)"
			class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium"
			:class="{ 'hover:bg-gray-50 text-gray-500 cursor-pointer': !isFirstPage, 'cursor-default text-gray-200': isFirstPage }"
		>
			Prev
		</button>
		<template x-for="page in pages" :key="page">
			<button
				class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
				:class="{ 'font-bold bg-blue-100 cursor-default': page === currentRefinement, 'hover:bg-gray-50 cursor-pointer': page !== currentRefinement }"
				x-text="page + 1"
				@click.prevent="refine(page)"
			></button>
		</template>
		<button
			@click.prevent="if (!isLastPage) refine(currentRefinement + 1)"
			class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium"
			:class="{ 'hover:bg-gray-50 text-gray-500 cursor-pointer': !isLastPage, 'cursor-default text-gray-200': isLastPage }"
		>
			Next
		</button>
	</nav>
	
</div>
