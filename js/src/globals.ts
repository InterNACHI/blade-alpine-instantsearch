import type { Connectors, InstantSearchFactory, SearchClientFactory } from './types';

declare global {
	interface Window {
		algoliasearch?: unknown;
		instantsearch?: InstantSearchFactory & { connectors: Connectors };
		'algoliasearch/lite'?: { liteClient?: SearchClientFactory };
	}
}

// Find the search client in whichever algoliasearch build the app loaded:
//  - v3 or v4 (lite or full): window.algoliasearch()
//  - v5 lite:           window['algoliasearch/lite'].liteClient()
//  - v5 full:           window.algoliasearch.algoliasearch()
export function globalSearchClientFactory(): SearchClientFactory {
	const algoliasearch = window.algoliasearch as SearchClientFactory | { algoliasearch?: SearchClientFactory } | undefined;
	
	const factory = typeof algoliasearch === 'function'
		? algoliasearch
		: window['algoliasearch/lite']?.liteClient ?? algoliasearch?.algoliasearch;
	
	if (! factory) {
		throw new Error('BladeAlpineInstantSearch: load algoliasearch before this script, or enable "bundle_algolia".');
	}
	
	return factory;
}

export function globalInstantSearch(): InstantSearchFactory & { connectors: Connectors } {
	if (! window.instantsearch) {
		throw new Error('BladeAlpineInstantSearch: load instantsearch.js before this script, or enable "bundle_algolia".');
	}
	
	return window.instantsearch;
}
