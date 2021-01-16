# Blade/Alpine InstantSearch

This is a work-in-progress package to allow you to implement [Algolia InstantSearch](https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/)
entirely with [Laravel Blade components](https://laravel.com/docs/8.x/blade).

![Demo of Code](https://user-images.githubusercontent.com/21592/104821179-1594fb80-5808-11eb-95b7-66a2909c2644.gif)

```xml
<x-instantsearch 
    application-id="latency" 
    search-key="6be0576ff61c053d5f9a3225e2a90f76" 
    index-name="instant_search"
>

    <x-instantsearch-search-box />
    
    <div class="flex">
        
        <div class="w-1/4 pr-4 pt-4">
            <x-instantsearch-refinement-list attribute="brand" />
        </div>
        
        <div class="flex-1">
            <x-instantsearch-hits>
                <div class="my-4 border p-4 shadow flex w-full">
                    <div>
                        <div x-text="hit.name" class="font-semibold text-lg mb-1"></div>
                        <div x-text="hit.description"></div>
                    </div>
                    <div class="ml-auto">
                        <div x-text="hit.popularity" class="bg-gray-100 rounded-full px-4 py-1"></div>
                    </div>
                </div>
            </x-instantsearch-hits>
        </div>
        
    </div>
</x-instantsearch>
```
