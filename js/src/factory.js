export default function factory(algoliasearch, instantsearch, connectors) {
	let BladeAlpineInstantSearch = function() {
		return {
			started: false,
			algolia: null,
			widgets: [],
			
			init() {
				let config = JSON.parse(this.$el.dataset.config);
				let client = algoliasearch(config.id, config.key);
				
				this.algolia = instantsearch({ indexName: config.index, searchClient: client });
				
				this.algolia.addWidgets(this.widgets);
				
				this.algolia.start();
				this.started = true;
			},
			
			addWidget(widget) {
				let connector_name = `connect${ widget.name }`;
				
				let callback = (options, first_render) => {
					if (connector_name in this) {
						this[connector_name](options, first_render);
					}
					widget.connect(options, first_render);
				};
				
				let connector = connectors[connector_name](callback)(widget.config);
				
				if (this.started) {
					this.algolia.addWidget(connector);
				} else {
					this.widgets.push(connector);
				}
			},
		};
	};
	
	BladeAlpineInstantSearch.widget = function(json) {
		let { name, config, defaults } = JSON.parse(json);
		
		return {
			...defaults,
			
			name,
			config,
			first_render: true,
			
			init() {
				setTimeout(() => this.$parent.addWidget(this), 1);
			},
			
			connect(options, first_render) {
				this.first_render = first_render;
				Object.entries(options).forEach(([key, value]) => this[key] = value);
			},
		};
	};
	
	return BladeAlpineInstantSearch;
};
