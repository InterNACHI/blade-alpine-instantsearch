<div id="{{ $id }}">
	<label for="{{ $id }}--input" class="block text-sm font-medium text-gray-700">
		Search
	</label>
	<div class="mt-1">
		<input 
			type="text" 
			id="{{ $id }}--input"
			class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
			placeholder="Search"
			x-model="search"
		/>
	</div>
</div>
