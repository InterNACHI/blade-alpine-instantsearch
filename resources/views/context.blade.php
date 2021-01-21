<div x-data="BladeAlpineInstantSearch($el, '{{ $config }}')" x-init="init" data-instantsearch-context>
	{{ $slot }}
</div>

@once
	{{ $javascript() }}
@endonce
