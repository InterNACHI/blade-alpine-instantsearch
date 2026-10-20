import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import factory from '../../src/factory.ts';
import type { InstantSearchFactory, RootComponent, WidgetComponent, WidgetConfig } from '../../src/types.ts';

const $el = {} as HTMLElement;

function setup() {
	const searchClient = { search: vi.fn() };
	const algoliasearch = vi.fn(() => searchClient);
	
	const search = { addWidgets: vi.fn(), start: vi.fn() };
	const instantsearch = vi.fn(() => search);
	
	const connectors = {
		connectSearchBox: vi.fn(render => (widgetParams: WidgetConfig) => ({ $$type: 'ais.searchBox', render, widgetParams })),
		connectHits: vi.fn(render => (widgetParams: WidgetConfig) => ({ $$type: 'ais.hits', render, widgetParams })),
	};
	
	const BladeAlpineInstantSearch = factory(algoliasearch, instantsearch as unknown as InstantSearchFactory, connectors);
	
	return { BladeAlpineInstantSearch, algoliasearch, searchClient, instantsearch, search, connectors };
}

// Mimics how Alpine merges a widget's x-data scope with the root component's scope
function mount(root: RootComponent, data: WidgetComponent): WidgetComponent & RootComponent {
	const scope = Object.create(root);
	Object.assign(scope, data);
	return scope;
}

describe('BladeAlpineInstantSearch()', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());
	
	test('creates an instantsearch instance from the component config', () => {
		const { BladeAlpineInstantSearch, algoliasearch, searchClient, instantsearch } = setup();
		
		BladeAlpineInstantSearch($el, {
			applicationId: 'APP',
			searchKey: 'KEY',
			indexName: 'products',
			routing: true,
			stalledSearchDelay: 500,
		});
		
		expect(algoliasearch).toHaveBeenCalledWith('APP', 'KEY');
		expect(instantsearch).toHaveBeenCalledWith({
			searchClient,
			indexName: 'products',
			routing: true,
			stalledSearchDelay: 500,
		});
	});
	
	test('returns the root Alpine component', () => {
		const { BladeAlpineInstantSearch, instantsearch } = setup();
		
		const root = BladeAlpineInstantSearch($el, { applicationId: 'APP', searchKey: 'KEY', indexName: 'products' });
		
		expect(root.widgets).toEqual([]);
		expect(root.instantsearch).toBe(instantsearch);
		expect(root.addWidget).toBeTypeOf('function');
		expect(root.init).toBeTypeOf('function');
	});
	
	test('addWidget() builds a widget from the matching connector', () => {
		const { BladeAlpineInstantSearch, connectors } = setup();
		const root = BladeAlpineInstantSearch($el, { applicationId: 'APP', searchKey: 'KEY', indexName: 'products' });
		const render = vi.fn();
		
		root.addWidget('SearchBox', { showReset: true }, render);
		
		expect(connectors.connectSearchBox).toHaveBeenCalledWith(render);
		expect(root.widgets).toEqual([{ $$type: 'ais.searchBox', render, widgetParams: { showReset: true } }]);
	});
	
	test('init() adds widgets and starts searching once child widgets have registered', () => {
		const { BladeAlpineInstantSearch, search } = setup();
		const root = BladeAlpineInstantSearch($el, { applicationId: 'APP', searchKey: 'KEY', indexName: 'products' });
		
		root.init();
		
		// Child widgets initialize after the root, so this must happen later
		root.addWidget('Hits', {}, () => {});
		expect(search.start).not.toHaveBeenCalled();
		
		vi.runAllTimers();
		
		expect(search.addWidgets).toHaveBeenCalledWith(root.widgets);
		expect(search.addWidgets.mock.calls[0][0]).toHaveLength(1);
		expect(search.start).toHaveBeenCalledOnce();
	});
});

describe('BladeAlpineInstantSearch.widget()', () => {
	test('returns widget state merged with defaults', () => {
		const { BladeAlpineInstantSearch } = setup();
		
		const widget = BladeAlpineInstantSearch.widget($el, 'SearchBox', { showReset: true }, { query: '', refine: null });
		
		expect(widget).toMatchObject({
			query: '',
			refine: null,
			name: 'SearchBox',
			config: { showReset: true },
			isFirstRender: true,
		});
		expect(widget.init).toBeTypeOf('function');
	});
	
	test('init() registers with the root and copies render options onto the component', () => {
		const { BladeAlpineInstantSearch, connectors } = setup();
		const root = BladeAlpineInstantSearch($el, { applicationId: 'APP', searchKey: 'KEY', indexName: 'products' });
		const widget = mount(root, BladeAlpineInstantSearch.widget($el, 'SearchBox', { showReset: true }, { query: '' }));
		
		widget.init();
		
		expect(root.widgets).toHaveLength(1);
		expect(root.widgets[0]).toMatchObject({ widgetParams: { showReset: true } });
		
		const render = connectors.connectSearchBox.mock.calls[0][0];
		const refine = () => {};
		
		render({ query: 'phone', refine }, true);
		expect(widget.isFirstRender).toBe(true);
		expect(widget.query).toBe('phone');
		expect(widget.refine).toBe(refine);
		
		render({ query: 'phones', refine }, false);
		expect(widget.isFirstRender).toBe(false);
		expect(widget.query).toBe('phones');
	});
});
