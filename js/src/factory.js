export default function factory(algoliasearch, instantsearch, connectors) {
	let BladeAlpineInstantSearch = function($el, config) {
		const { applicationId, searchKey, ...options } = config;
		
		const client = instantsearch({
			searchClient: algoliasearch(applicationId, searchKey),
			...options
		});
		
		return {
			widgets: [],
			instantsearch,
			addWidget(name, config, render) {
				const widget = connectors[`connect${ name }`](render);
				this.widgets.push(widget(config));
			},
			init() {
				setTimeout(() => {
					client.addWidgets(this.widgets);
					client.start();
				}, 1);
			},
		};
	};
	
	BladeAlpineInstantSearch.widget = function($el, name, config, defaults) {
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
};
