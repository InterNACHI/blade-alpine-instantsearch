import type { InstantSearchOptions, SearchClient, Widget } from 'instantsearch.js';
import type InstantSearch from 'instantsearch.js/es/lib/InstantSearch';

export type SearchClientFactory = (applicationId: string, searchKey: string) => SearchClient;

export type InstantSearchFactory = ((options: InstantSearchOptions) => InstantSearch) & Record<string, unknown>;

// A connector takes a render function and returns a widget factory
export type Connector = (render: RenderFunction, unmount?: () => void) => (widgetParams: WidgetConfig) => Widget;

export type Connectors = Record<string, unknown>;

export type RenderFunction = (renderOptions: Record<string, unknown>, isFirstRender: boolean) => void;

export type WidgetConfig = Record<string, unknown> | unknown[];

// The config rendered by the <x-instantsearch> Blade component
export type RootConfig = Omit<InstantSearchOptions, 'searchClient'> & {
	applicationId: string;
	searchKey: string;
};

export interface RootComponent {
	widgets: Widget[];
	instantsearch: InstantSearchFactory;
	addWidget(name: string, config: WidgetConfig, render: RenderFunction): void;
	init(): void;
}

export interface WidgetComponent {
	name: string;
	config: WidgetConfig;
	isFirstRender: boolean;
	init(this: WidgetComponent & RootComponent): void;
	[key: string]: unknown;
}

export interface BladeAlpineInstantSearch {
	($el: HTMLElement, config: RootConfig): RootComponent;
	widget($el: HTMLElement, name: string, config: WidgetConfig, defaults: Record<string, unknown>): WidgetComponent;
}
