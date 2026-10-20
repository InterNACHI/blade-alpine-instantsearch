import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Render the Blade fixture page with the package's real components (requires PHP and `composer install`)
export default function globalSetup() {
	const here = dirname(fileURLToPath(import.meta.url));
	execFileSync('php', [join(here, 'fixtures', 'render.php'), join(here, '.rendered')], { stdio: 'inherit' });
}
