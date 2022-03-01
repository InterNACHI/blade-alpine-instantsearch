<div x-data="BladeAlpineInstantSearch($el, {{ $config }})">
	{{ $slot }}
</div>

@once
	{{ $javascript() }}
@endonce
