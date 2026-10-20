<?php

// Renders the Blade fixture page once for every JavaScript bundle combination
// so that the browser tests run against real component output.

use Illuminate\Support\Facades\Blade;
use InterNACHI\BladeInstantSearch\Providers\BladeInstantSearchProvider;
use Orchestra\Testbench\Foundation\Application;

require __DIR__.'/../../../../vendor/autoload.php';

$output = $argv[1] ?? __DIR__.'/../.rendered';

if (! is_dir($output)) {
	mkdir($output, 0777, true);
}

// [bundle_algolia, bundle_alpine, app also loads its own Alpine, algoliasearch build the app loads]
$variants = [
	'root-algolia-alpine' => [true, true, false, null],
	'root-algolia-alpine.app-alpine' => [true, true, true, null],
	'root-algolia' => [true, false, true, null],
	'root-alpine' => [false, true, false, 'algoliasearch-lite'],
	'root-alpine.app-alpine' => [false, true, true, 'algoliasearch-lite'],
	'root' => [false, false, true, 'algoliasearch-lite'],
	'root.algoliasearch-full' => [false, false, true, 'algoliasearch-full'],
	'root.algoliasearch-v4' => [false, false, true, 'algoliasearch-v4'],
];

$app = Application::create(options: [
	'extra' => ['providers' => [BladeInstantSearchProvider::class]],
]);

foreach ($variants as $variant => [$bundle_algolia, $bundle_alpine, $app_alpine, $algoliasearch]) {
	$app['view']->flushState();
	$app['config']->set('instantsearch.bundle_algolia', $bundle_algolia);
	$app['config']->set('instantsearch.bundle_alpine', $bundle_alpine);
	
	$html = Blade::render(file_get_contents(__DIR__.'/page.blade.php'), compact('variant', 'bundle_algolia', 'bundle_alpine', 'app_alpine', 'algoliasearch'));
	
	file_put_contents("{$output}/{$variant}.html", $html);
}
