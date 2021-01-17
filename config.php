<?php

return [
	
	/*
    |--------------------------------------------------------------------------
    | Dependency Bundling
    |--------------------------------------------------------------------------
    |
    | To keep things as plug-and-play as possible, the following Algolia 
	| packages are inlined with the Blade components:
	|
	|  - alpinejs
	|  - algoliasearch/lite
	|  - instantsearch.js 
    |
	| If you are already including these packages from CDN or in your app's
	| build process, you can disable bundling so that the code isn't loaded
	| twice in your app. 
    */
	'bundle_alpine' => true,
	'bundle_algolia' => true,
	
	/*
    |--------------------------------------------------------------------------
    | Render Mode
    |--------------------------------------------------------------------------
    |
    | The package ships with default component styles that work well with any
	| site designed using Tailwind CSS. If you would like to have full control
	| over your templates, you may enable "renderless" mode, which will simply
	| wire up the Alpine state for you and leave the rest of the UI up to you.
    */
	'renderless' => false,
	
];
