# Blade/Alpine InstantSearch

This is a work-in-progress package to allow you to implement [Algolia InstantSearch](https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/)
entirely with [Laravel Blade components](https://laravel.com/docs/8.x/blade).

## Usage

### Components

Not all components are implemented, and most of the UI is likely to change before a 1.0
release. The current implementation is a proof-of-concept that we'll be refining in some
internal tools over the coming months. All components should work in 
[renderless mode](#renderless-mode), but UI has only been implemented for the following:

 - `<x-instantsearch>` — the wrapper that provides configuration and context
 - `<x-instantsearch-search-box>` — the search input
 - `<x-instantsearch-hits>` — rendering search results/hits
 - `<x-instantsearch-hit>` — rendering a specific attribute in a hit
 - `<x-instantsearch-highlight>` — rendering a specific attribute highlighted based on input
 - `<x-instantsearch-numeric-menu>` — Filtering by numeric values (like price/votes/etc)
 - `<x-instantsearch-refinement-list>` — Filtering by tags/categories/etc
 - `<x-instantsearch-pagination>` — Paginating results

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
