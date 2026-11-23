#!/usr/bin/env node
// Keeps agent instruction files in sync with AGENTS.md (the single source of truth).
//
// - .github/copilot-instructions.md is a generated copy of AGENTS.md, because Copilot code review
//   reads only that file and does not expand @-imports.
// - CLAUDE.md and GEMINI.md must import AGENTS.md (`@AGENTS.md` or `@./AGENTS.md`).
//
// Usage: node scripts/sync-agent-docs.mjs           (regenerate the Copilot copy)
//        node scripts/sync-agent-docs.mjs --check   (exit 1 if anything is out of sync)
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { REPO_ROOT, exists } from "./lib/skills.mjs";

const SOURCE = "AGENTS.md";
const COPY = ".github/copilot-instructions.md";
const IMPORTERS = ["CLAUDE.md", "GEMINI.md"];
const HEADER =
  "<!-- Generated from AGENTS.md by `npm run agents:sync`. Do not edit; change AGENTS.md instead. -->\n\n";
const IMPORT_RE = /^@(\.\/)?AGENTS\.md\s*$/m;

const check = process.argv.includes("--check");
const problems = [];

const source = await readFile(join(REPO_ROOT, SOURCE), "utf8");
const expected = HEADER + source;
const copyPath = join(REPO_ROOT, COPY);
const current = (await exists(copyPath)) ? await readFile(copyPath, "utf8") : null;

if (current !== expected) {
  if (check) problems.push(`${COPY} is out of sync with ${SOURCE}. Run: npm run agents:sync`);
  else {
    await writeFile(copyPath, expected);
    console.log(`Updated ${COPY} from ${SOURCE}`);
  }
}

for (const file of IMPORTERS) {
  const p = join(REPO_ROOT, file);
  if (!(await exists(p))) problems.push(`${file} is missing; it should contain the line: @AGENTS.md`);
  else if (!IMPORT_RE.test(await readFile(p, "utf8"))) problems.push(`${file} must import AGENTS.md with a line: @AGENTS.md`);
}

if (problems.length) {
  for (const m of problems) console.error(`  ✗ ${m}`);
  process.exit(1);
}
console.log(`✓ Agent instruction files are in sync with ${SOURCE}`);
