import { afterEach, describe, expect, test, vi } from 'vitest';
import { globalInstantSearch, globalSearchClientFactory } from '../../src/globals.ts';

describe('globalSearchClientFactory()', () => {
	afterEach(() => vi.unstubAllGlobals());
	
	test('supports algoliasearch v3 and v4', () => {
		const algoliasearch = vi.fn();
		vi.stubGlobal('window', { algoliasearch });
		
		expect(globalSearchClientFactory()).toBe(algoliasearch);
	});
	
	test('supports the algoliasearch v5 lite build', () => {
		const liteClient = vi.fn();
		vi.stubGlobal('window', { 'algoliasearch/lite': { liteClient } });
		
		expect(globalSearchClientFactory()).toBe(liteClient);
	});
	
	test('supports the algoliasearch v5 full build', () => {
		const algoliasearch = vi.fn();
		vi.stubGlobal('window', { algoliasearch: { algoliasearch } });
		
		expect(globalSearchClientFactory()).toBe(algoliasearch);
	});
	
	test('explains what is missing', () => {
		vi.stubGlobal('window', {});
		
		expect(() => globalSearchClientFactory()).toThrow(/load algoliasearch/);
	});
});

describe('globalInstantSearch()', () => {
	afterEach(() => vi.unstubAllGlobals());
	
	test('returns window.instantsearch', () => {
		const instantsearch = Object.assign(vi.fn(), { connectors: {} });
		vi.stubGlobal('window', { instantsearch });
		
		expect(globalInstantSearch()).toBe(instantsearch);
	});
	
	test('explains what is missing', () => {
		vi.stubGlobal('window', {});
		
		expect(() => globalInstantSearch()).toThrow(/load instantsearch.js/);
	});
});
