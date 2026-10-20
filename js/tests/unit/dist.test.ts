import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

// The Blade component inlines these files in a <script> tag
describe.each(['root', 'root-alpine', 'root-algolia', 'root-algolia-alpine'])('dist/%s.js', bundle => {
	const source = readFileSync(new URL(`../../dist/${bundle}.js`, import.meta.url), 'utf8');
	
	test('defines the BladeAlpineInstantSearch global', () => {
		expect(source).toMatch(/^var BladeAlpineInstantSearch\s*=/);
	});
	
	test('can be safely inlined in a script tag', () => {
		expect(source).not.toMatch(/<\/script/i);
	});
});
