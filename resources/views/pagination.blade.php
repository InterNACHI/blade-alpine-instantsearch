<div id="{{ $id }}" x-show="{{ $widgetState('nbPages', 1) }} > 1" class="relative z-0 inline-flex space-x-4 items-center">
	
	<span class="text-sm">
		Page <b x-text="{{ $widgetState('currentRefinement', 0) }} + 1"></b>
		of <b x-text="{{ $widgetState('nbPages', 1) }}"></b>
	</span>
	
	<nav class="relative inline-flex shadow-sm -space-x-px" aria-label="Pagination">
		<button
			@click.prevent="if (!{{ $widgetState('isFirstPage', false) }}) {{ $widgetState('refine') }}({{ $widgetState('currentRefinement', 1) }} - 1)"
			class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium"
			:class="{ 'hover:bg-gray-50 text-gray-500 cursor-pointer': !{{ $widgetState('isFirstPage', false) }}, 'cursor-default text-gray-200': {{ $widgetState('isFirstPage', false) }} }"
		>
			Prev
		</button>
		<template x-for="page in {{ $widgetState('pages', '[]') }}" :key="page">
			<button
				class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
				:class="{ 'font-bold bg-blue-100 cursor-default': page === {{ $widgetState('currentRefinement', null) }}, 'hover:bg-gray-50 cursor-pointer': page !== {{ $widgetState('currentRefinement', null) }} }"
				x-text="page + 1"
				@click.prevent="{{ $widgetState('refine') }}(page)"
			></button>
		</template>
		<button
			@click.prevent="if (!{{ $widgetState('isLastPage', false) }}) {{ $widgetState('refine') }}({{ $widgetState('currentRefinement', 1) }} + 1)"
			class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium"
			:class="{ 'hover:bg-gray-50 text-gray-500 cursor-pointer': !{{ $widgetState('isLastPage', false) }}, 'cursor-default text-gray-200': {{ $widgetState('isLastPage', false) }} }"
		>
			Next
		</button>
	</nav>
	
</div>
