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

// [bundle_algolia, bundle_alpine, app also loads its own Alpine]
$variants = [
	'root-algolia-alpine' => [true, true, false],
	'root-algolia-alpine.app-alpine' => [true, true, true],
	'root-algolia' => [true, false, true],
	'root-alpine' => [false, true, false],
	'root-alpine.app-alpine' => [false, true, true],
	'root' => [false, false, true],
];

$app = Application::create(options: [
	'extra' => ['providers' => [BladeInstantSearchProvider::class]],
]);

foreach ($variants as $variant => [$bundle_algolia, $bundle_alpine, $app_alpine]) {
	$app['view']->flushState();
	$app['config']->set('instantsearch.bundle_algolia', $bundle_algolia);
	$app['config']->set('instantsearch.bundle_alpine', $bundle_alpine);
	
	$html = Blade::render(file_get_contents(__DIR__.'/page.blade.php'), compact('variant', 'bundle_algolia', 'bundle_alpine', 'app_alpine'));
	
	file_put_contents("{$output}/{$variant}.html", $html);
}
