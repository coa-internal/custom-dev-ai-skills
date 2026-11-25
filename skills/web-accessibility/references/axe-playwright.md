# axe helper for Playwright

A shared helper that fails a test on any WCAG 2.1 A or AA violation, and only allows narrow,
explained exceptions (A11Y-002, A11Y-003, A11Y-004). Put it in the project's shared test folder (for
example `tests/support/a11y.ts`) and call it from every page-level test.

Requires `@playwright/test` and `@axe-core/playwright` as dev dependencies. Adding them is a
dependency change; say so in the pull request.

```ts
import { expect, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

/** WCAG 2.1 Level A and AA rules (dev-standards A11Y-001, A11Y-002). */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Fails the test if axe finds any WCAG 2.1 AA violations on the current page.
 *
 * Dismiss a confirmed false positive as narrowly as possible, with a reason a reviewer can
 * evaluate (A11Y-004). Never exclude a whole page or disable a rule for everything.
 */
export async function expectNoA11yViolations(
	page: Page,
	{
		exclusions = [],
		disabledRules = [],
	}: {
		/** Elements axe should skip. */
		exclusions?: { selector: string; reason: string }[];
		/** axe rule IDs to turn off for this scan. */
		disabledRules?: { rule: string; reason: string }[];
	} = {},
) {
	const builder = new AxeBuilder({ page })
		.withTags(WCAG_TAGS)
		.disableRules(disabledRules.map(({ rule }) => rule));
	for (const { selector } of exclusions) builder.exclude(selector);
	const results = await builder.analyze();
	expect(results.violations).toEqual([]);
}
```

## Using it

Scan each significant state (A11Y-003):

```ts
import { test, expect } from '@playwright/test';
import { expectNoA11yViolations } from '../support/a11y.ts';

test('search page has no accessibility violations', async ({ page }) => {
	await page.goto('/search');
	await expectNoA11yViolations(page);

	// Error state
	await page.getByRole('button', { name: 'Search' }).click();
	await expect(page.getByText('Enter an address')).toBeVisible();
	await expectNoA11yViolations(page);

	// Alternate view
	await page.getByRole('tab', { name: 'List' }).click();
	await expectNoA11yViolations(page);
});
```

A keyboard-only path (A11Y-008):

```ts
test('a keyboard-only user can search for an address', async ({ page }) => {
	await page.goto('/search');
	await page.keyboard.press('Tab'); // skip link
	await page.keyboard.press('Tab');
	await expect(page.getByRole('combobox', { name: 'Address' })).toBeFocused();
	await page.keyboard.type('100 Example St');
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
});
```

An approved exception (A11Y-004), with a reason:

```ts
await expectNoA11yViolations(page, {
	exclusions: [
		{
			selector: '.vendor-widget iframe',
			reason: 'Third-party iframe; issue tracked with the vendor.',
		},
	],
});
```
