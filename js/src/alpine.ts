import Alpine from 'alpinejs';

declare global {
	interface Window {
		Alpine?: unknown;
	}
}

// Start the bundled Alpine, unless the app (or Livewire) brings its own. Apps
// usually load Alpine with a deferred or module script, which runs after this
// inline script, so wait until the document has been parsed to decide.
export function startAlpine(): void {
	const start = () => {
		if (! window.Alpine) {
			window.Alpine = Alpine;
			Alpine.start();
		}
	};
	
	if ('loading' === document.readyState) {
		document.addEventListener('DOMContentLoaded', start, { once: true });
	} else {
		start();
	}
}
