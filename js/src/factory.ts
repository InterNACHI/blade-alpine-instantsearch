import type {
	BladeAlpineInstantSearch,
	Connector,
	Connectors,
	InstantSearchFactory,
	RootComponent,
	SearchClientFactory,
	WidgetComponent,
} from './types';

export default function factory(
	algoliasearch: SearchClientFactory,
	instantsearch: InstantSearchFactory,
	connectors: Connectors,
): BladeAlpineInstantSearch {
	const BladeAlpineInstantSearch = function($el: HTMLElement, config) {
		const { applicationId, searchKey, ...options } = config;
		
		const client = instantsearch({
			searchClient: algoliasearch(applicationId, searchKey),
			...options,
		});
		
		const root: RootComponent = {
			widgets: [],
			instantsearch,
			addWidget(name, config, render) {
				const connector = connectors[`connect${ name }`] as Connector | undefined;
				
				if (! connector) {
					throw new Error(`BladeAlpineInstantSearch: no "connect${ name }" connector is available. If it's a custom widget, enable "bundle_all_connectors".`);
				}
				
				this.widgets.push(connector(render)(config));
			},
			init() {
				// Child widgets initialize after the root, so wait for them to register
				setTimeout(() => {
					client.addWidgets(this.widgets);
					client.start();
				}, 1);
			},
		};
		
		return root;
	} as BladeAlpineInstantSearch;
	
	BladeAlpineInstantSearch.widget = function($el, name, config, defaults): WidgetComponent {
		return {
			...defaults,
			name,
			config,
			isFirstRender: true,
			
			init() {
				this.addWidget(name, config, (options, isFirstRender) => {
					this.isFirstRender = isFirstRender;
					Object.entries(options).forEach(([key, value]) => {
						this[key] = value;
					});
				});
			},
		};
	};
	
	return BladeAlpineInstantSearch;
}
