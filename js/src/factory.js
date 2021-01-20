export default function factory(algoliasearch, instantsearch, connectors) {
	let BladeAlpineInstantSearch = function() {
		return {
			search: '',
			algolia: null,
			hits: [],
			
			init() {
				let config = JSON.parse(this.$el.dataset.config);
				let client = algoliasearch(config.id, config.key);
				
				this.algolia = instantsearch({ indexName: config.index, searchClient: client });
				
				this.algolia.start();
			},
			
			addWidget(widget) {
				let connector = `connect${ widget.name }`;
				
				let callback = (options, first_render) => {
					if (connector in this) {
						this[connector](options, first_render);
					}
					widget.connect(options, first_render);
				};
				
				this.algolia.addWidget(connectors[connector](callback)(widget.config));
			},
			
			// connectSearchBox(options, first_render) {
			// 	let { query, refine } = options;
			//	
			// 	if (first_render) {
			// 		this.$watch('search', value => refine(value));
			// 	}
			//	
			// 	this.search = query;
			// },
			
			connectHits(options) {
				this.hits = options.hits;
			},
			
		};
	};
	
	BladeAlpineInstantSearch.widget = function() {
		return {
			name: '',
			config: {},
			items: [],
			first_render: true,
			
			init() {
				let { name, config, defaults } = JSON.parse(this.$el.dataset.config);
				
				this.name = name;
				this.config = config;
				
				Object.entries(defaults).forEach(([key, value]) => this[key] = value);
				
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
