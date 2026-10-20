<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>{{ $variant }}</title>
	@unless($bundle_algolia)
		<script src="/vendor/{{ $algoliasearch }}.js"></script>
		<script src="/vendor/instantsearch.js"></script>
	@endunless
	@if($app_alpine)
		<script defer src="/vendor/alpine.js"></script>
	@endif
</head>
<body>
	<x-instantsearch application-id="TESTAPP" search-key="search-key" index-name="products">
		<x-instantsearch::search-box data-test="search-box" />
		
		<x-instantsearch::refinement-list attribute="brand" id="brand" data-test="brands" />
		
		<x-instantsearch::clear-refinements data-test="clear" />
		
		<x-instantsearch::menu attribute="category" renderless data-test="categories">
			<template x-for="item in items" :key="item.value">
				<button type="button" x-text="item.label" @click="refine(item.value)" :class="{ active: item.isRefined }"></button>
			</template>
		</x-instantsearch::menu>
		
		<x-instantsearch::hits data-test="hits">
			<article class="hit">
				<x-instantsearch::highlight attribute="name" tag-name="h2" />
				<x-instantsearch::hit attribute="brand" class="brand" />
				<x-instantsearch::snippet attribute="description" class="snippet" />
			</article>
			<x-slot:empty>
				<p data-test="empty">No results</p>
			</x-slot:empty>
		</x-instantsearch::hits>
		
		<x-instantsearch::pagination data-test="pagination" />
	</x-instantsearch>
</body>
</html>
