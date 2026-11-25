// Prettier config for this repository (dev-standards FMT-002).
// The City base options come from the dev-standards skill and must not be changed here. Add
// plugins, plugin options, or overrides for file types the base does not cover.
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

const base = JSON.parse(
	readFileSync(
		new URL('./skills/dev-standards/assets/prettier-base.json', import.meta.url),
		'utf8',
	),
);

export default {
	...base,
	overrides: [...base.overrides],
};
