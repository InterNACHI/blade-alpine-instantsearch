import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { search, type SearchRequest } from './algolia-stub.ts';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));

// Stand-ins for the CDN scripts that apps load themselves when bundling is disabled
const vendor: Record<string, string> = {
	'/vendor/algoliasearch-lite.js': require.resolve('algoliasearch/dist/lite/builds/browser.umd.js'),
	'/vendor/algoliasearch-full.js': require.resolve('algoliasearch/dist/algoliasearch.umd.js'),
	'/vendor/algoliasearch-v4.js': require.resolve('algoliasearch-v4/dist/algoliasearch-lite.umd.js'),
	'/vendor/instantsearch.js': require.resolve('instantsearch.js/dist/instantsearch.production.min.js'),
	'/vendor/alpine.js': require.resolve('alpinejs/dist/cdn.min.js'),
};

// Each variant is one bundle (see InstantSearch::javascript()). ".app-alpine" pages
// also load their own copy of Alpine, like apps that use Livewire or Alpine already.
const variants = [
	'root-algolia-alpine',
	'root-algolia-alpine.app-alpine',
	'root-algolia-alpine-slim',
	'root-algolia',
	'root-algolia-slim',
	'root-alpine',
	'root-alpine.app-alpine',
	'root',
	'root.algoliasearch-full',
	'root.algoliasearch-v4',
];

for (const variant of variants) {
	test.describe(variant, () => {
		let queries: SearchRequest[];
		
		test.beforeEach(async ({ page }) => {
			queries = [];
			
			page.on('pageerror', error => { throw error; });
			
			// Count how many copies of Alpine start on the page
			await page.addInitScript(() => {
				(window as any).alpineStarts = 0;
				document.addEventListener('alpine:init', () => (window as any).alpineStarts++);
			});
			
			await page.route('**/*', async route => {
				const url = new URL(route.request().url());
				
				if (url.hostname.includes('algolia')) {
					const body = JSON.parse(route.request().postData() || '{}');
					queries.push(...body.requests);
					
					return route.fulfill({
						status: 200,
						contentType: 'application/json',
						headers: { 'access-control-allow-origin': '*' },
						body: JSON.stringify({ results: body.requests.map(search) }),
					});
				}
				
				if (url.pathname in vendor) {
					return route.fulfill({ contentType: 'text/javascript', body: readFileSync(vendor[url.pathname]) });
				}
				
				if (url.pathname === `/${variant}.html`) {
					return route.fulfill({ contentType: 'text/html', body: readFileSync(join(here, '.rendered', `${variant}.html`)) });
				}
				
				return route.fulfill({ status: 404 });
			});
			
			await page.goto(`http://blade-instantsearch.test/${variant}.html`);
		});
		
		test('sends credentials and index name to Algolia', async ({ page }) => {
			await expect(page.locator('.hit')).toHaveCount(2);
			expect(queries.length).toBeGreaterThan(0);
			expect(queries.every(q => q.indexName === 'products')).toBe(true);
		});
		
		test('starts exactly one copy of Alpine', async ({ page }) => {
			await expect(page.locator('.hit')).toHaveCount(2);
			expect(await page.evaluate(() => (window as any).alpineStarts)).toBe(1);
		});
		
		test('renders hits with highlight, hit and snippet components', async ({ page }) => {
			const first = page.locator('.hit').first();
			
			await expect(first.locator('h2')).toHaveText('iPhone 15');
			await expect(first.locator('.brand')).toHaveText('Apple');
			await expect(first.locator('.snippet mark')).toHaveText('made');
		});
		
		test('searches as you type and highlights matches', async ({ page }) => {
			await page.locator('[data-test="search-box"]').fill('galaxy');
			
			await expect(page.locator('.hit')).toHaveCount(1);
			await expect(page.locator('.hit h2')).toHaveText('Galaxy S24');
			await expect(page.locator('.hit h2 mark')).toHaveText('Galaxy');
		});
		
		test('shows the empty state when nothing matches', async ({ page }) => {
			await expect(page.locator('[data-test="empty"]')).toBeHidden();
			
			await page.locator('[data-test="search-box"]').fill('nothing matches this');
			
			await expect(page.locator('.hit')).toHaveCount(0);
			await expect(page.locator('[data-test="empty"]')).toBeVisible();
		});
		
		test('refines by a refinement list and clears refinements', async ({ page }) => {
			const brands = page.locator('[data-test="brands"]');
			const clear = page.locator('[data-test="clear"]');
			
			await expect(brands.locator('label')).toHaveText(['Apple', 'Samsung']);
			await expect(brands.locator('span')).toHaveText(['2', '1']);
			await expect(clear).toBeHidden();
			
			await brands.locator('input[type="checkbox"]').nth(1).check();
			
			await expect(page.locator('.hit')).toHaveCount(1);
			await expect(page.locator('.hit h2')).toHaveText('Galaxy S24');
			await expect(clear).toBeVisible();
			
			await clear.click();
			
			await expect(page.locator('.hit')).toHaveCount(2);
			await expect(clear).toBeHidden();
		});
		
		test('supports renderless widgets', async ({ page }) => {
			const categories = page.locator('[data-test="categories"] button');
			
			await expect(categories).toHaveText(['Laptops', 'Phones']);
			
			await categories.filter({ hasText: 'Laptops' }).click();
			
			await expect(page.locator('.hit')).toHaveCount(1);
			await expect(page.locator('.hit h2')).toHaveText('MacBook Air');
		});
		
		test('paginates', async ({ page }) => {
			const pagination = page.locator('[data-test="pagination"]');
			
			await expect(pagination.locator('span.text-sm')).toHaveText(/Page\s+1\s+of\s+2/);
			await expect(page.locator('.hit h2')).toHaveText(['iPhone 15', 'Galaxy S24']);
			
			await pagination.getByRole('button', { name: 'Next' }).click();
			
			await expect(pagination.locator('span.text-sm')).toHaveText(/Page\s+2\s+of\s+2/);
			await expect(page.locator('.hit h2')).toHaveText(['MacBook Air']);
		});
	});
}
