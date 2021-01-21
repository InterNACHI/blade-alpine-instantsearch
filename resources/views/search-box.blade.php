<?php /** @var \Illuminate\View\ComponentAttributeBag $attributes */ ?>

<div {{ $attributes->only(['x-data', 'x-init']) }} class="relative">
	<input
		{{ $attributes->except(['x-model', '@input'])
			->merge([
				'type' => 'text', 
				'placeholder' => 'Search', 
				'class' => 'shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md'
			]) }}
		x-model="query"
		@input="refine(query)"
	/>
	<div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none hidden" :class="{ hidden: !isSearchStalled }">
		<svg class="w-4 h-4 animate-spin text-gray-300" aria-hidden="true" fill="currentColor" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
			<path fill="currentColor" d="M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"></path>
		</svg>
	</div>
</div>
