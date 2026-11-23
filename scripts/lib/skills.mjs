// Shared helpers for discovering and parsing skills in this repo.
import { readdir, readFile, stat } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SKILLS_DIR = join(REPO_ROOT, "skills");

/** Harnesses we support. Keep in sync with docs/AUTHORING.md and the smoke test. */
export const HARNESSES = ["claude-code", "gemini-cli", "antigravity", "github-copilot"];

export const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const NAME_MAX = 64;
export const DESCRIPTION_MAX = 1024;
export const LOCAL_PREFIX = "local-";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Split a SKILL.md into its frontmatter source and body. Throws on a missing block. */
export function splitFrontmatter(text) {
  const m = FRONTMATTER_RE.exec(text);
  if (!m) throw new Error("missing YAML frontmatter block (--- ... ---) at top of file");
  return { yamlSource: m[1], body: text.slice(m[0].length) };
}

/** Parse the frontmatter of a SKILL.md. Throws on invalid YAML or a non-mapping. */
export function parseFrontmatter(text) {
  const { yamlSource, body } = splitFrontmatter(text);
  const data = parseYaml(yamlSource, { strict: true, uniqueKeys: true });
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("frontmatter must be a YAML mapping");
  }
  return { data, body };
}

/** List skill folders under skills/ (each directory directly under skills/). */
export async function listSkillDirs() {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/** Recursively list files under dir, relative to dir, using forward slashes. */
export async function listFiles(dir, base = dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(full, base)));
    else if (e.isFile()) out.push(full.slice(base.length + 1).split("\\").join("/"));
  }
  return out.sort();
}

export async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/** Parse the comma-separated metadata.compatibility string into harness ids. */
export function parseCompatibility(value) {
  if (typeof value !== "string") return null;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Load every skill folder. Returns objects with parse errors captured rather than thrown,
 * so the linter can report all problems at once.
 */
export async function loadSkills() {
  const skills = [];
  for (const folder of await listSkillDirs()) {
    const dir = join(SKILLS_DIR, folder);
    const skillMd = join(dir, "SKILL.md");
    const skill = { folder, dir, skillMd, data: null, body: "", error: null };
    if (!(await exists(skillMd))) {
      skill.error = "missing SKILL.md";
    } else {
      try {
        const text = await readFile(skillMd, "utf8");
        Object.assign(skill, parseFrontmatter(text));
      } catch (err) {
        skill.error = `invalid frontmatter: ${err.message}`;
      }
    }
    skills.push(skill);
  }
  return skills;
}

export function isInternal(skill) {
  return skill.data?.metadata?.internal === true;
}
