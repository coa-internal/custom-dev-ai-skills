#!/usr/bin/env node
// Checks that a repository follows the City formatting standard (FMT-001, FMT-002, FMT-004).
//
// Usage, from the repository root (Prettier 3 must be installed in the repository, per FMT-002):
//   node .agents/skills/dev-standards/scripts/check-formatting.mjs
//
// Exits 1 and lists each problem with its rule ID. This does not replace `prettier --check .`
// (FMT-003); it checks that the configuration is the City's, so that check means the same thing in
// every repository.
//
// Warnings do not change the exit code. Today there is one: the repository's package.json lists
// Prettier with a range, tag or other non-exact version, which FMT-002 says SHOULD be pinned.
import { readFile, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import console from 'node:console';
import process from 'node:process';

const ASSETS = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const BASE_CONFIG = resolve(ASSETS, 'prettier-base.json');
const BASELINE_EDITORCONFIG = resolve(ASSETS, 'editorconfig.baseline');
const END_MARKER = '# --- end of City baseline ---';

// One sample path per kind of file the base options treat differently.
const SAMPLES = [
	'example.ts',
	'example.tsx',
	'example.json',
	'example.md',
	'SKILL.md',
	'example.yml',
];
// Paths that must be ignored (FMT-004). Only checked when the folder or file exists in this repo.
const VENDORED = [
	'.agents/skills/example/SKILL.md',
	'.claude/skills/example/SKILL.md',
	'skills-lock.json',
];

const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const DEPENDENCY_FIELDS = ['devDependencies', 'dependencies', 'optionalDependencies'];

const problems = [];
const warnings = [];
const fail = (rule, msg) => problems.push(`${rule}: ${msg}`);
const warn = (rule, msg) => warnings.push(`${rule}: ${msg}`);
const normalize = (s) => s.replace(/\r\n/g, '\n');

async function readOrNull(path) {
	try {
		return normalize(await readFile(path, 'utf8'));
	} catch {
		return null;
	}
}

async function checkEditorconfig() {
	const baseline = await readOrNull(BASELINE_EDITORCONFIG);
	const actual = await readOrNull('.editorconfig');
	if (actual === null) return fail('FMT-001', '.editorconfig is missing at the repository root.');
	const expected = baseline.slice(0, baseline.indexOf(END_MARKER) + END_MARKER.length);
	if (!actual.startsWith(expected)) {
		fail(
			'FMT-001',
			`.editorconfig must start with the City baseline, unchanged, through "${END_MARKER}". Copy it from ${relative(process.cwd(), BASELINE_EDITORCONFIG)}.`,
		);
	}
}

async function checkPrettier() {
	let prettier;
	try {
		prettier = await import('prettier');
	} catch {
		return fail(
			'FMT-002',
			'Prettier is not installed in this repository (npm install -D prettier).',
		);
	}
	if (!prettier.version?.startsWith('3.')) {
		fail('FMT-002', `Prettier 3 is required; found ${prettier.version}.`);
	}

	const base = JSON.parse(await readFile(BASE_CONFIG, 'utf8'));
	const baseKeys = new Set(Object.keys(base).filter((k) => k !== 'overrides'));
	for (const o of base.overrides ?? []) for (const k of Object.keys(o.options)) baseKeys.add(k);

	for (const sample of SAMPLES) {
		const path = resolve(sample);
		const actual = (await prettier.resolveConfig(path, { editorconfig: true })) ?? {};
		const expected = (await prettier.resolveConfig(path, { config: BASE_CONFIG })) ?? {};
		for (const key of baseKeys) {
			if (actual[key] !== expected[key]) {
				fail(
					'FMT-002',
					`${sample}: Prettier option "${key}" is ${JSON.stringify(actual[key])}, the City base sets ${JSON.stringify(expected[key])}.`,
				);
			}
		}
	}

	for (const path of VENDORED) {
		const top = path.split('/').slice(0, 2).join('/');
		if (!(await exists(top))) continue;
		const info = await prettier.getFileInfo(resolve(path), { ignorePath: '.prettierignore' });
		if (!info.ignored) fail('FMT-004', `${top} must be listed in .prettierignore.`);
	}
}

// FMT-002 (SHOULD): Prettier is pinned to an exact version in package.json. Only the root
// package.json is read; a repository that declares Prettier elsewhere (for example in a workspace
// package) is not warned.
async function checkPrettierPin() {
	let manifest;
	try {
		manifest = JSON.parse(await readFile('package.json', 'utf8'));
	} catch {
		return;
	}
	for (const field of DEPENDENCY_FIELDS) {
		const spec = manifest[field]?.prettier;
		if (typeof spec === 'string' && !EXACT_VERSION.test(spec)) {
			warn(
				'FMT-002',
				`package.json ${field} lists prettier as "${spec}". Pin an exact version (for example "3.10.1") so every contributor and CI format identically.`,
			);
		}
	}
}

async function exists(path) {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}

await checkEditorconfig();
await checkPrettier();
await checkPrettierPin();

if (warnings.length > 0) {
	console.warn(`Formatting standard: ${warnings.length} warning(s)\n`);
	for (const w of warnings) console.warn(`  - ${w}`);
	console.warn('');
}
if (problems.length > 0) {
	console.error(`Formatting standard: ${problems.length} problem(s)\n`);
	for (const p of problems) console.error(`  - ${p}`);
	process.exit(1);
}
console.log(
	'Formatting standard: .editorconfig, Prettier options, and ignores match the City baseline.',
);
