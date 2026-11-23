#!/usr/bin/env node
// Install smoke test: installs every skill in this repo into a throwaway git repo for each
// supported agent target using the pinned `skills` CLI, then checks that the expected files exist
// and match the source byte-for-byte, and that internal skills are not installed.
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { REPO_ROOT, HARNESSES, loadSkills, isInternal, listFiles, exists } from "./lib/skills.mjs";

// Project-level skill directory each harness reads (per `skills` CLI docs/agents.md, v1.7.6).
const AGENT_DIRS = {
  "claude-code": ".claude/skills",
  "gemini-cli": ".agents/skills",
  antigravity: ".agents/skills",
  "github-copilot": ".agents/skills",
};

const CLI = join(REPO_ROOT, "node_modules", "skills", "bin", "cli.mjs");
const env = { ...process.env, DISABLE_TELEMETRY: "1", NO_COLOR: "1", CI: "1" };
delete env.INSTALL_INTERNAL_SKILLS;

const run = (args, cwd) => execFileSync(process.execPath, [CLI, ...args], { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const failures = [];
const fail = (m) => failures.push(m);

if (!(await exists(CLI))) {
  console.error("skills CLI not installed. Run: npm ci");
  process.exit(1);
}

const all = (await loadSkills()).filter((s) => !s.error);
const publicSkills = all.filter((s) => !isInternal(s));
const internalSkills = all.filter(isInternal);

// 1. Discovery: `skills add <repo> --list` must list every public skill and no internal ones.
const listOut = run(["add", REPO_ROOT, "--list"], tmpdir());
for (const s of publicSkills) if (!listOut.includes(s.data.name)) fail(`--list does not show "${s.data.name}"`);
for (const s of internalSkills) {
  if (new RegExp(`^\\W*${s.data.name}\\s*$`, "m").test(listOut)) fail(`--list shows internal skill "${s.data.name}"`);
}

// 2. Install for each agent target into a fresh git repo.
for (const agent of HARNESSES) {
  const dir = await mkdtemp(join(tmpdir(), `skills-smoke-${agent}-`));
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir });
    run(["add", REPO_ROOT, "--skill", "*", "-a", agent, "--copy", "-y"], dir);
    const base = join(dir, AGENT_DIRS[agent]);
    for (const s of publicSkills) {
      const target = join(base, s.data.name);
      if (!(await exists(join(target, "SKILL.md")))) {
        fail(`[${agent}] ${AGENT_DIRS[agent]}/${s.data.name}/SKILL.md was not installed`);
        continue;
      }
      const srcFiles = await listFiles(s.dir);
      const dstFiles = await listFiles(target);
      if (srcFiles.join("\n") !== dstFiles.join("\n")) {
        fail(`[${agent}] ${s.data.name}: installed file list differs from source`);
        continue;
      }
      for (const f of srcFiles) {
        const [a, b] = await Promise.all([readFile(join(s.dir, f)), readFile(join(target, f))]);
        if (!a.equals(b)) fail(`[${agent}] ${s.data.name}/${f}: installed copy differs from source`);
      }
    }
    for (const s of internalSkills) {
      if (await exists(join(base, s.data.name))) fail(`[${agent}] internal skill "${s.data.name}" was installed`);
    }
    const lock = JSON.parse(await readFile(join(dir, "skills-lock.json"), "utf8"));
    for (const s of publicSkills) if (!lock.skills?.[s.data.name]) fail(`[${agent}] skills-lock.json has no entry for "${s.data.name}"`);
    console.log(`  ${agent}: installed ${publicSkills.length} skill(s) into ${AGENT_DIRS[agent]}/`);
  } catch (e) {
    fail(`[${agent}] install failed: ${e.stderr || e.message}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

if (failures.length) {
  console.error(`\nSmoke install failed with ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`✓ Smoke install passed for ${HARNESSES.join(", ")}`);
