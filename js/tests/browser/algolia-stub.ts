// A tiny in-memory stand-in for the Algolia multi-query endpoint. It understands
// both the v4 (URL-encoded `params` string) and v5 (plain object) request shapes.

type Product = Record<string, string>;
type Params = Record<string, any>;
type FacetFilters = string | Array<string | string[]>;

export interface SearchRequest {
	indexName: string;
	params?: string | Params;
	[key: string]: unknown;
}

export const products: Product[] = [
	{ objectID: '1', name: 'iPhone 15', brand: 'Apple', category: 'Phones', description: 'A phone made by Apple with a great camera.' },
	{ objectID: '2', name: 'Galaxy S24', brand: 'Samsung', category: 'Phones', description: 'A phone made by Samsung with a big screen.' },
	{ objectID: '3', name: 'MacBook Air', brand: 'Apple', category: 'Laptops', description: 'A thin laptop made by Apple.' },
];

export const HITS_PER_PAGE = 2;

function parseParams(request: SearchRequest): Params {
	const { indexName, params, ...rest } = request;
	
	if (typeof params !== 'string') {
		return { ...rest, ...(params || {}) };
	}
	
	const parsed: Params = {};
	for (const [key, value] of new URLSearchParams(params)) {
		try {
			parsed[key] = JSON.parse(value);
		} catch {
			parsed[key] = value;
		}
	}
	
	return parsed;
}

function matchesFilter(product: Product, filter: string): boolean {
	const [attribute, ...value] = filter.split(':');
	return String(product[attribute]) === value.join(':');
}

function matchesFacetFilters(product: Product, facetFilters: FacetFilters = []): boolean {
	const filters = typeof facetFilters === 'string' ? [facetFilters] : facetFilters;
	
	return filters.every(filter => Array.isArray(filter)
		? filter.some(f => matchesFilter(product, f))
		: matchesFilter(product, filter));
}

function highlight(value: string, query: string, pre: string, post: string): string {
	if (!query) {
		return value;
	}
	
	const index = value.toLowerCase().indexOf(query.toLowerCase());
	if (index === -1) {
		return value;
	}
	
	return value.slice(0, index) + pre + value.slice(index, index + query.length) + post + value.slice(index + query.length);
}

export function search(request: SearchRequest) {
	const params = parseParams(request);
	const query = params.query || '';
	const page = Number(params.page || 0);
	const hitsPerPage = params.hitsPerPage ?? HITS_PER_PAGE;
	const pre = params.highlightPreTag || '<em>';
	const post = params.highlightPostTag || '</em>';
	
	const matches = products
		.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
		.filter(p => matchesFacetFilters(p, params.facetFilters));
	
	const requestedFacets: string[] = [].concat(params.facets || []);
	const facets: Record<string, Record<string, number>> = {};
	for (const facet of requestedFacets) {
		facets[facet] = {};
		for (const product of matches) {
			facets[facet][product[facet]] = (facets[facet][product[facet]] || 0) + 1;
		}
	}
	
	const hits = hitsPerPage === 0 ? [] : matches
		.slice(page * hitsPerPage, (page + 1) * hitsPerPage)
		.map(product => ({
			...product,
			_highlightResult: {
				name: { value: highlight(product.name, query, pre, post), matchLevel: 'full', matchedWords: [query] },
				brand: { value: product.brand, matchLevel: 'none', matchedWords: [] },
			},
			_snippetResult: {
				description: { value: highlight(product.description, 'made', pre, post), matchLevel: 'full' },
			},
		}));
	
	return {
		index: request.indexName,
		query,
		params: typeof request.params === 'string' ? request.params : '',
		hits,
		nbHits: matches.length,
		page,
		nbPages: hitsPerPage === 0 ? 0 : Math.ceil(matches.length / hitsPerPage),
		hitsPerPage,
		facets,
		exhaustiveFacetsCount: true,
		exhaustiveNbHits: true,
		processingTimeMS: 1,
	};
}
