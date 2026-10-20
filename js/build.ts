import { build } from 'vite';

// Each bundle is a standalone IIFE that defines a global `BladeAlpineInstantSearch`.
// The PHP side picks one based on the `bundle_algolia`, `bundle_alpine` and
// `bundle_all_connectors` config.
const bundles = ['root', 'root-alpine', 'root-algolia', 'root-algolia-alpine', 'root-algolia-slim', 'root-algolia-alpine-slim'];

for (const bundle of bundles) {
	await build({
		configFile: false,
		logLevel: 'warn',
		define: {
			'process.env.NODE_ENV': JSON.stringify('production'),
		},
		build: {
			outDir: 'dist',
			emptyOutDir: false,
			sourcemap: false,
			lib: {
				entry: `src/${bundle}.ts`,
				formats: ['iife'],
				name: 'BladeAlpineInstantSearch',
				fileName: () => `${bundle}.js`,
			},
		},
	});
	
	console.log(`Built dist/${bundle}.js`);
}
