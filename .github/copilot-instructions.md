<!-- Generated from AGENTS.md by `npm run agents:sync`. Do not edit; change AGENTS.md instead. -->

# Repository guide

Trust these instructions; search the repository only when they are incomplete or appear incorrect.

## What this repository is

This small, public repository publishes portable AI coding-agent skills for City of Asheville
repositories. Consumers copy skills from pinned Git tags, not an npm package. Skills are Markdown
with YAML frontmatter; the validation tools are Node.js ES modules. Supported targets are
`claude-code`, `gemini-cli`, `antigravity`, and `github-copilot`. One repo-wide semantic version
applies to skills and the reusable workflow.

## Setup and validation

Use Node.js >= 22.20.0 and Git; CI uses Node 22.x on Ubuntu. The lockfile pins `skills` 1.7.6 and
`yaml` 2.9.1. From the repository root, on a fresh checkout always install dependencies before
running checks:

```bash
export DISABLE_TELEMETRY=1
npm ci --ignore-scripts
npm test
```

`npm test` runs `npm run lint`, `npm run catalog:check`, `npm run agents:check`, then
`npm run smoke` in that order; these are the same checks as `.github/workflows/ci.yml`. The smoke test uses the locally installed CLI,
creates temporary Git repositories, checks discovery, copied files and lockfiles for all four targets,
and removes its temporary repositories. It does not prove that the actual agent harnesses load or
behave correctly: manually test a changed skill in each harness listed in its compatibility metadata.

There is no separate build, application server, or conventional unit-test suite. Run individual
checks via `npm run lint`, `npm run catalog:check`, and `npm run smoke`. For changes to public
skill names, descriptions, or compatibility, regenerate the README table before checking:

```bash
npm run catalog
npm test
```

Commit the generated README change. Do not edit the text between its catalog markers by hand.
Without dependencies, lint fails with `ERR_MODULE_NOT_FOUND` for `yaml`; run `npm ci --ignore-scripts`.
A stale catalog fails with `README.md catalog is out of date`; run `npm run catalog`. The clean
bootstrap, checks and catalog regeneration were verified with Node 24.15.0/npm 11.12.1; CI's Node
22.x is the target, but was not locally verified in that run. `npm ci` may require registry access.

## Where to change things

- `skills/<name>/SKILL.md`: skill instructions and frontmatter; optional `references/`, `scripts/`,
  and `assets/` travel with that skill. `skills/skill-template/` is an internal annotated starter;
  `skills/git-pr-description/` is the published example.
- `scripts/lib/skills.mjs`: discovery, YAML parsing, shared limits and harness list.
  `scripts/lint-skills.mjs`: validation; `scripts/gen-catalog.mjs`: README catalog;
  `scripts/smoke-install.mjs`: real CLI install and byte comparison.
- `docs/AUTHORING.md`: authoritative authoring, safety, testing and semver rules.
  `docs/CONSUMING.md`: pinned installs, upgrades and consumer CI behavior.
  `docs/PLAN.md` is a historical plan; prefer current workflows and docs when it conflicts.
- `AGENTS.md` (this file) is the single source of agent instructions. `CLAUDE.md` and `GEMINI.md`
  only import it (`@AGENTS.md`). `.github/copilot-instructions.md` is a generated copy for Copilot
  code review: after editing this file, run `npm run agents:sync` and commit both. Never edit the
  copy directly; `npm run agents:check` (in CI) fails when it is out of sync.
- `package.json` and `package-lock.json`: scripts, engines and pinned dependencies.
  `README.md`: consumer quick start and generated catalog. `CONTRIBUTING.md`: contribution process;
  `CHANGELOG.md`: release notes; `SECURITY.md`: private reporting.
- `.github/workflows/ci.yml`: PR/main validation. `release.yml`: a `vX.Y.Z` tag requires a nonempty
  matching `## [X.Y.Z]` changelog section and creates a GitHub Release.
  `verify-skills.yml`: reusable consumer workflow; blocking lockfile/pin and restored-copy drift
  checks, plus a non-blocking newer-tag warning. It uses `jq`, Git and the pinned CLI on Ubuntu.
  `.github/pull_request_template.md` and `CODEOWNERS` define review requirements.

## Skill and contribution invariants

- Keep the layout flat. The frontmatter `name` must match its folder, use lowercase letters/digits
  and single hyphens, be <= 64 characters, and not start with `local-` (reserved for consumers).
  `description` is required and <= 1024 characters; specify when the skill should trigger.
  `metadata.compatibility` is a comma-separated list of supported targets actually tested;
  `metadata.internal: true` hides a skill from wildcard installs and the catalog, but does not
  prevent explicit installation.
- Relative Markdown links must resolve inside the skill folder. Every file under a skill's
  `scripts/` must be referenced in its `SKILL.md`; scripts must be optional or cross-platform.
  Keep instructions portable across harnesses.
- For skill changes, add an `Unreleased` changelog entry and identify the semver impact: removal,
  rename or breaking interfaces are major; new skills or trigger changes are minor; compatible
  wording and fixes are patch. Follow `docs/AUTHORING.md` for workflow changes and release details.
- This repository and PR content are public and may be public records. Never include PII,
  credentials, internal hostnames/IPs, privileged content or sensitive procedures. Disclose AI
  assistance in the PR and verify generated claims; use the PR template and do not invent evidence.
  Report security issues privately as described in `SECURITY.md`.
