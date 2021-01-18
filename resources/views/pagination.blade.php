<div id="{{ $id }}">
	<nav class="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
		<a
			href="#"
			@click.prevent="if (!{{ $widgetState('isFirstPage', false) }}) {{ $widgetState('refine') }}({{ $widgetState('currentRefinement', 1) }} - 1)"
			class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium"
			:class="{ 'hover:bg-gray-50 text-gray-500': !{{ $widgetState('isFirstPage', false) }}, 'cursor-default text-gray-200': {{ $widgetState('isFirstPage', false) }} }"
		>
			<span class="sr-only">Previous</span>
			<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
				<path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
			</svg>
		</a>
		<template x-for="page in {{ $widgetState('pages', '[]') }}" :key="page">
			<a 
				href="#" 
				class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
				:class="{ 'font-bold bg-blue-100': page === {{ $widgetState('currentRefinement', null) }}, 'hover:bg-gray-50': page !== {{ $widgetState('currentRefinement', null) }} }"
				x-text="page + 1"
				@click.prevent="{{ $widgetState('refine') }}(page)"
			></a>
		</template>
		<a
			href="#"
			@click.prevent="if (!{{ $widgetState('isLastPage', false) }}) {{ $widgetState('refine') }}({{ $widgetState('currentRefinement', 1) }} + 1)"
			class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium"
			:class="{ 'hover:bg-gray-50 text-gray-500': !{{ $widgetState('isLastPage', false) }}, 'cursor-default text-gray-200': {{ $widgetState('isLastPage', false) }} }"
		>
			<span class="sr-only">Next</span>
			<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
				<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
			</svg>
		</a>
	</nav>
</div>
