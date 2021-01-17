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
				
				return connectors[connector](this[connector].bind(this))(widget.config);
			},
			
			connectSearchBox(options, firstRender) {
				let { query, refine } = options;
				
				if (firstRender) {
					this.$watch('search', value => refine(value));
				}
				
				this.search = query;
			},
			
			connectHits(options) {
				this.hits = options.hits;
			},
			
			connectRefinementList(options) {
				this.widgetState[options.widgetParams.id] = options;
			},
		};
	};
};
