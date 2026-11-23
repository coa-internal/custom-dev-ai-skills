#!/usr/bin/env node
// Lints every skill under skills/ against the rules in docs/AUTHORING.md.
// Usage: node scripts/lint-skills.mjs        (exit 1 on any error)
import { readFile } from "node:fs/promises";
import { join, dirname, resolve, relative } from "node:path";
import {
  REPO_ROOT,
  HARNESSES,
  NAME_RE,
  NAME_MAX,
  DESCRIPTION_MAX,
  LOCAL_PREFIX,
  loadSkills,
  listFiles,
  exists,
  parseCompatibility,
} from "./lib/skills.mjs";

const errors = [];
const err = (skill, msg) => errors.push(`skills/${skill.folder}: ${msg}`);

// Markdown inline links and images: [text](target) / ![alt](target "title")
const LINK_RE = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const isExternal = (t) => /^[a-z][a-z0-9+.-]*:/i.test(t) || t.startsWith("//");

/** Strip fenced code blocks and inline code so example links are not checked. */
function stripCode(md) {
  return md.replace(/^(```|~~~)[\s\S]*?^\1/gm, "").replace(/`[^`\n]*`/g, "");
}

async function checkLinks(skill) {
  const mdFiles = (await listFiles(skill.dir)).filter((f) => f.endsWith(".md"));
  for (const rel of mdFiles) {
    const file = join(skill.dir, rel);
    const text = stripCode(await readFile(file, "utf8"));
    for (const [, rawTarget] of text.matchAll(LINK_RE)) {
      if (isExternal(rawTarget) || rawTarget.startsWith("#")) continue;
      const target = decodeURIComponent(rawTarget.split("#")[0].split("?")[0]);
      if (!target) continue;
      const resolved = resolve(dirname(file), target);
      if (relative(skill.dir, resolved).startsWith("..")) {
        err(skill, `${rel}: link "${rawTarget}" points outside the skill folder (installs copy only the skill folder)`);
      } else if (!(await exists(resolved))) {
        err(skill, `${rel}: broken relative link "${rawTarget}"`);
      }
    }
  }
}

async function checkScriptsReferenced(skill) {
  const scriptsDir = join(skill.dir, "scripts");
  if (!(await exists(scriptsDir))) return;
  const scripts = await listFiles(scriptsDir);
  const skillText = await readFile(skill.skillMd, "utf8");
  for (const s of scripts) {
    if (!skillText.includes(`scripts/${s}`)) {
      err(skill, `scripts/${s} is not referenced from SKILL.md (reference it as "scripts/${s}")`);
    }
  }
}

function checkFrontmatter(skill) {
  const { data } = skill;
  const { name, description, metadata } = data;

  if (typeof name !== "string" || !name) {
    err(skill, `"name" is required and must be a string`);
  } else {
    if (name !== skill.folder) err(skill, `"name" (${name}) must equal the folder name (${skill.folder})`);
    if (!NAME_RE.test(name)) err(skill, `"name" must match ${NAME_RE} (lowercase letters, digits, single hyphens)`);
    if (name.length > NAME_MAX) err(skill, `"name" must be at most ${NAME_MAX} characters`);
    if (name.startsWith(LOCAL_PREFIX)) err(skill, `"name" must not start with "${LOCAL_PREFIX}" (reserved for consumer-local skills)`);
  }

  if (typeof description !== "string" || !description.trim()) {
    err(skill, `"description" is required and must be a non-empty string`);
  } else if (description.length > DESCRIPTION_MAX) {
    err(skill, `"description" is ${description.length} characters; the limit is ${DESCRIPTION_MAX}`);
  }

  if (metadata === undefined || metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    err(skill, `"metadata" mapping is required (it must contain "compatibility")`);
    return;
  }
  if ("internal" in metadata && typeof metadata.internal !== "boolean") {
    err(skill, `"metadata.internal" must be a boolean (true/false), not ${JSON.stringify(metadata.internal)}`);
  }
  const compat = parseCompatibility(metadata.compatibility);
  if (!compat || compat.length === 0) {
    err(skill, `"metadata.compatibility" is required: a comma-separated list of ${HARNESSES.join(", ")}`);
  } else {
    for (const h of compat) {
      if (!HARNESSES.includes(h)) err(skill, `"metadata.compatibility" has unknown harness "${h}" (allowed: ${HARNESSES.join(", ")})`);
    }
  }
}

const skills = await loadSkills();
if (skills.length === 0) errors.push("skills/: no skills found");

const seen = new Map();
for (const skill of skills) {
  if (skill.error) {
    err(skill, skill.error);
    continue;
  }
  checkFrontmatter(skill);
  const n = skill.data.name;
  if (typeof n === "string") {
    if (seen.has(n)) err(skill, `duplicate skill name "${n}" (also in skills/${seen.get(n)})`);
    else seen.set(n, skill.folder);
  }
  await checkLinks(skill);
  await checkScriptsReferenced(skill);
}

if (errors.length) {
  console.error(`Skill lint failed with ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`✓ ${skills.length} skill(s) passed lint (${relative(process.cwd(), REPO_ROOT) || "."}/skills)`);
