<?php /** @var \Illuminate\View\ComponentAttributeBag $attributes */ ?>

<div {{ $attributes }}>
	<template x-for="item in items" :key="item.value">
		<div class="relative flex items-start mb-1">
			<div>
				<input
					:key="item.value"
					:id="'{{ $id }}' + '_' + item.value"
					:value="item.isRefined"
					@change="refine(item.value)"
					type="checkbox"
					class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
				/>
			</div>
			<div class="mx-2 text-sm">
				<label
					:for="'{{ $id }}' + '_' + item.value"
					x-text="item.label"
					class="font-medium text-gray-700"
				></label>
			</div>
			<div class="ml-auto">
				<span
					class="inline-flex items-center px-2 py-px rounded-full text-xs font-medium bg-gray-100 text-gray-800"
					x-text="item.count.toLocaleString()"
				></span>
			</div>
		</div>
	</template>
	
	@if($show_more)
		<button
			class="block w-full px-2 py-1 rounded border border-gray-300 bg-white text-sm font-medium hover:bg-gray-100 text-gray-500 cursor-pointer"
			:class="{ hidden: !canToggleShowMore }"
			x-text="isShowingMore ? 'Show Less' : 'Show More'"
			@click.prevent="toggleShowMore()"
		></button>
	@endif
</div>

