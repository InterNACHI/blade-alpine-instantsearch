<?php

return [
	
	'algolia' => [
		'app' => env('ALGOLIA_APP', 'latency'),
		'search_key' => env('ALGOLIA_SEARCH_KEY', '6be0576ff61c053d5f9a3225e2a90f76'),
		'demo_index' => env('ALGOLIA_DEMO_INDEX', 'instant_search'),
	],

];
