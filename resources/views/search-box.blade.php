<div {{ $widget_attributes }}>
	<input
		type="text"
		class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
		placeholder="Search"
		x-model="query"
		@change="refine($el.value)"
	/>
</div>
