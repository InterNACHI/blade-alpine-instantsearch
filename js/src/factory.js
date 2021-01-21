export default function factory(algoliasearch, instantsearch, connectors) {
	let BladeAlpineInstantSearch = function($el, json) {
		let {
			applicationId,
			searchKey,
			...options
		} = JSON.parse(json);
		
		let searchClient = algoliasearch(applicationId, searchKey);
		
		let widgets = [];
		$el.addBladeAlpineInstantSearchWidget = widget => widgets.push(widget);
		
		return {
			algolia: null,
			widgets: [],
			
			init() {
				this.algolia = instantsearch({ searchClient, ...options });
				
				this.widgets = widgets.map(widget => this.connectWidget(widget));
				this.algolia.addWidgets(this.widgets);
				
				this.algolia.start();
			},
			
			connectWidget(widget) {
				let connector_name = `connect${ widget.name }`;
				
				let callback = (options, first_render) => {
					if (connector_name in this) {
						this[connector_name](options, first_render);
					}
					widget.connect(options, first_render);
				};
				
				return connectors[connector_name](callback)(widget.config);
			},
		};
	};
	
	BladeAlpineInstantSearch.widget = function($el, name, json, defaults) {
		let config = JSON.parse(json);
		
		return {
			...defaults,
			name,
			config,
			first_render: true,
			
			init() {
				$el.parentNode
					.closest('[data-instantsearch-context]')
					.addBladeAlpineInstantSearchWidget(this);
			},
			
			connect(options, first_render) {
				this.first_render = first_render;
				Object.entries(options).forEach(([key, value]) => this[key] = value);
			},
		};
	};
	
	return BladeAlpineInstantSearch;
};
