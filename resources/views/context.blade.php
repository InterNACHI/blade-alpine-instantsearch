@once
	{{ $javascript() }}
@endonce

<div x-data="BladeAlpineInstantSearch()" x-init="init" data-config="{{ $config() }}">
	{{ $slot }}
</div>
