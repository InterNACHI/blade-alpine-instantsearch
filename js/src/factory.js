export default function factory(algoliasearch, instantsearch, connectors) {
	let BladeAlpineInstantSearch = function($el, json) {
		let {
			applicationId,
			searchKey,
			...options
		} = JSON.parse(json);
		
		let searchClient = algoliasearch(applicationId, searchKey);
		let algolia = instantsearch({ searchClient, ...options });
		
		let widgets = [];
		$el.addBladeAlpineInstantSearchWidget = (name, config, render) => {
			let connector_name = `connect${ name }`;
			let connected_widget = connectors[connector_name](render);
			widgets.push(connected_widget(config));
		};
		
		return {
			init() {
				algolia.addWidgets(widgets);
				algolia.start();
			},
		};
	};
	
	BladeAlpineInstantSearch.widget = function($el, name, json, defaults) {
		let config = JSON.parse(json);
		
		return {
			...defaults,
			name,
			config,
			instantsearch,
			first_render: true,
			
			init() {
				$el.parentNode
					.closest('[data-instantsearch-context]')
					.addBladeAlpineInstantSearchWidget(name, config, this.render.bind(this));
			},
			
			render(options, first_render) {
				this.first_render = first_render;
				Object.entries(options).forEach(([key, value]) => {
					this[key] = value;
					if (['boolean', 'number', 'string'].includes(typeof value)) {
						console.log(name, key, value);
					}
				});
			},
		};
	};
	
	return BladeAlpineInstantSearch;
};
