<div>
	<template x-for="item in {{ $widgetState('items', '[]') }}" :key="item">
		<div class="relative flex items-start">
			<div>
				<input
					:key="item.value"
					:value="item.value"
					:id="{{ $widgetState('widgetParams.id') }} + '_' + item.value"
					:checked="item.isRefined"
					@change="{{ $widgetState('refine') }}($event.target.value)"
					type="checkbox"
					class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
				/>
			</div>
			<div class="mx-2 text-sm">
				<label
					:for="{{ $widgetState('widgetParams.id') }} + '_' + item.value"
					x-text="item.label"
					class="font-medium text-gray-700"
				></label>
			</div>
			<div class="ml-auto">
				<span
					class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
					x-text="item.count"
				></span>
			</div>
		</div>
	</template>
</div>

