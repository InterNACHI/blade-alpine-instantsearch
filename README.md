# Blade/Alpine InstantSearch

<div>
	<a href="https://packagist.org/packages/internachi/blade-alpine-instantsearch" target="_blank">
        <img 
            src="https://poser.pugx.org/internachi/blade-alpine-instantsearch/v/stable" 
            alt="Latest Stable Release" 
        />
	</a>
	<a href="./LICENSE" target="_blank" class="mx-1">
        <img 
            src="https://poser.pugx.org/internachi/blade-alpine-instantsearch/license" 
            alt="MIT Licensed" 
        />
    </a>
</div>

This is a work-in-progress package to allow you to implement [Algolia InstantSearch](https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/)
entirely with [Laravel Blade components](https://laravel.com/docs/8.x/blade).

## Usage

### Components

Not all components are implemented, and most of the UI is likely to change before a 1.0
release. The current implementation is a proof-of-concept that we'll be refining in some
internal tools over the coming months. All components should work in 
[renderless mode](#renderless-mode), but UI has only been implemented for the following:

 - `<x-instantsearch>` — the wrapper that provides configuration and context
 - `<x-instantsearch::search-box>` — the search input
 - `<x-instantsearch::hits>` — rendering search results/hits
 - `<x-instantsearch::hit>` — rendering a specific attribute in a hit
 - `<x-instantsearch::highlight>` — rendering a specific attribute highlighted based on input
 - `<x-instantsearch::numeric-menu>` — Filtering by numeric values (like price/votes/etc)
 - `<x-instantsearch::refinement-list>` — Filtering by tags/categories/etc
 - `<x-instantsearch::pagination>` — Paginating results

All components map as closely to [InstantSearch.js](https://www.algolia.com/doc/api-reference/widgets/js/)
as possible (in fact, much of the API was autogenerated from the JS documentation). For
now, it's probably best to refer to the JS docs for configuration reference.

### Alpine

Under the hood, all components use [Alpine.js v3](https://github.com/alpinejs/alpine) to
handle state and rendering. For example, the search box component uses Alpine's
[`x-model`](https://github.com/alpinejs/alpine#x-model) to track the `query` value,
and [`x-on:input`](https://github.com/alpinejs/alpine#x-on) to pass that value to the
instantsearch `refine()` method. The looks something like:

```html
<input
    type="text"
    placeholder="Search"
    x-model="query"
    @input="refine(query)"
/>
```

Under the hood, this package injects itself into the Blade component's
[attributes](https://laravel.com/docs/8.x/blade#component-attributes) to connect
to the instantsearch instance—everything else is just Alpine and Blade.

### Using Existing Templates

All components come pre-bundled with templates that will work with any project that uses
[Tailwind CSS](https://tailwindcss.com). If you want to tweak a specific template you can
publish your own version with:

```bash
php artisan vendor:publish --tag=instantsearch
```

### Renderless Mode

If you prefer more fine-grained control over each component, you can enable `renderless`
mode which simply wires up your component state but leaves the UI entirely in your hands.

You can either do this on a component-by-component basis by using a `renderless` attribute
on the component:

```html
<x-instantsearch-refinement-list attribute="brand" renderless>
    <!-- Do whatever you want here -->
</x-instantsearch-refinement-list>
```

Or you can publish the package config file with:

```bash
php artisan vendor:publish --tag=instantsearch
```

And then enable the `renderless` config option which will cause all components to work
in this mode by default.
