@once
	<script src="https://cdn.jsdelivr.net/gh/alpinejs/alpine@v2.x.x/dist/alpine.min.js" defer></script>
	<script
		src="https://cdn.jsdelivr.net/npm/algoliasearch@4.5.1/dist/algoliasearch-lite.umd.js"
		integrity="sha256-EXPXz4W6pQgfYY3yTpnDa3OH8/EPn16ciVsPQ/ypsjk="
		crossorigin="anonymous"
	></script>
	<script
		src="https://cdn.jsdelivr.net/npm/instantsearch.js@4.8.3/dist/instantsearch.production.min.js"
		integrity="sha256-LAGhRRdtVoD6RLo2qDQsU2mp+XVSciKRC8XPOBWmofM="
		crossorigin="anonymous"
	></script>
	<script>
	window.BladeAlpineInstantSearch = function() {
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
				let connector = `connect${widget.name}`;
				
				return instantsearch.connectors[connector](this[connector].bind(this))(widget.config);
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
	</script>
@endonce

<div x-data="BladeAlpineInstantSearch()" x-init="init" data-config="{{ $config }}">
	{{ $slot }}
	<div id="searchbox"></div>
	<div id="hits"></div>
</div>
