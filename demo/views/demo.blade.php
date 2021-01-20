<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	
	<title>
		Demo
	</title>
	
	<link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
	<link href="https://tailwindcss-forms.vercel.app/dist/forms.min.css" rel="stylesheet">
</head>
<body class="antialiased">

<div class="container mx-auto my-12">
	
	<x-instantsearch 
		:application-id="config('services.algolia.app')" 
		:search-key="config('services.algolia.search_key')" 
		:index-name="config('services.algolia.demo_index')"
	>
		<!-- Search Box -->
		<x-instantsearch-search-box />
		
		<div class="flex">
			<div class="w-1/4 pr-4 pt-4">
				
				<!-- Refinements -->
				<h2 class="my-3 font-bold">
					Brand
				</h2>
				
				<x-instantsearch-refinement-list attribute="brand" />
				
				<h2 class="my-3 font-bold">
					Price
				</h2>
				
				<x-instantsearch-numeric-menu
					attribute="price"
					:items="[
						['label' => 'All'],
						['label' => 'Less than $50', 'end' => 49],
						['label' => '$50-100', 'start' => 50, 'end' => 100],
						['label' => '$100-250', 'start' => 100, 'end' => 250],
						['label' => '$250-500', 'start' => 250, 'end' => 500],
						['label' => '$500-1000', 'start' => 500, 'end' => 1000],
						['label' => 'Over $1000', 'start' => 1000],
					]"
				/>
				
			</div>
			<div class="flex-1">
				
				<!-- Hits -->
				<x-instantsearch-hits>
					<div class="my-4 border p-4 shadow flex w-full">
						<div>
							
							<x-instantsearch-highlight 
								attribute="name" 
								class="font-semibold text-lg mb-1" 
							/>
							
							<x-instantsearch-highlight attribute="description" />
							
						</div>
						<div class="ml-auto">
							
							<div class="bg-gray-100 rounded-full px-4 py-1 flex">
								$
								<x-instantsearch-hit attribute="price" />
							</div>
							
						</div>
					</div>
				</x-instantsearch-hits>
				
			</div>
		</div>
		
		<div class="flex justify-center w-full my-6">
{{--			<x-instantsearch-pagination />--}}
		</div>
		
	</x-instantsearch>
	
</div>

</body>
</html>
