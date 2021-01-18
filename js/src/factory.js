export default function factory(algoliasearch, instantsearch, connectors) {
	return () => {
		return {
			search: '',
			algolia: null,
			hits: [],
			widgetState: {},
			
			init() {
				let config = JSON.parse(this.$el.dataset.config);
				let client = algoliasearch(config.id, config.key);
				
				this.algolia = instantsearch({ indexName: config.index, searchClient: client });
				
				let widgets = config.widgets.map(widget => this.connectWidget(widget));
				this.algolia.addWidgets(widgets);
				
				setTimeout(() => this.algolia.start(), 1);
				setTimeout(() => console.log(this.hits), 1000);
			},
			
			getWidgetState(id, key, fallback = {}) {
				let paths = key.split('.');
				paths.unshift(id);
				
				try {
					return paths.reduce((object, path) => {
						if (!(path in object)) {
							throw false;
						}
						return object[path];
					}, this.widgetState);
				} catch {
					return fallback;
				}
			},
			
			connectWidget(widget) {
				let connector = `connect${ widget.name }`;
				let callback = connector in this
					? this[connector].call(this, widget)
					: (options) => this.widgetState[widget.id] = options;
				
				return connectors[connector](callback)(widget.config);
			},
			
			connectSearchBox(widget) {
				return (options, firstRender) => {
					let { query, refine } = options;
					
					if (firstRender) {
						this.$watch('search', value => refine(value));
					}
					
					this.search = query;
				};
			},
			
			connectHits(widget) {
				return options => this.hits = options.hits;
			},
			
		};
	};
};
