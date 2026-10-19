export default function factory(algoliasearch, instantsearch, connectors) {
	let BladeAlpineInstantSearch = function($el, config) {
		const { applicationId, searchKey, ...options } = config;
		
		if ('object' === typeof options.routing) {
			options.routing = { stateMapping: urlParamStateMapping(options.indexName, options.routing) };
		}
		
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

function urlParamStateMapping(indexName, urlParams) {
	const params = Object.entries(urlParams).map(([param, uiStateKey]) => {
		const [key, ...attribute] = uiStateKey.split('.');
		
		return [param, key, attribute.join('.')];
	});
	
	return {
		stateToRoute(uiState) {
			const state = JSON.parse(JSON.stringify(uiState[indexName] || {}));
			const route = {};
			
			delete state.configure;
			
			params.forEach(([param, key, attribute]) => {
				const container = attribute ? state[key] : state;
				const name = attribute || key;
				
				if (! container || undefined === container[name]) {
					return;
				}
				
				route[param] = container[name];
				delete container[name];
				
				if (attribute && ! Object.keys(container).length) {
					delete state[key];
				}
			});
			
			return Object.keys(state).length
				? { ...route, [indexName]: state }
				: route;
		},
		routeToState(route = {}) {
			const state = { ...route[indexName] };
			
			delete state.configure;
			
			params
				.filter(([param]) => param in route)
				.forEach(([param, key, attribute]) => {
					const value = urlValue(key, route[param]);
					
					if (undefined === value) {
						return;
					}
					
					state[key] = attribute
						? { ...state[key], [attribute]: value }
						: value;
				});
			
			return Object.keys(state).length
				? { [indexName]: state }
				: {};
		},
	};
}

function urlValue(key, value) {
	if ('refinementList' === key) {
		return [].concat(value).filter(item => 'string' === typeof item);
	}
	
	if ('page' === key) {
		return 'string' === typeof value && /^\d+$/.test(value) ? value : undefined;
	}
	
	return 'string' === typeof value
		? value
		: undefined;
}
