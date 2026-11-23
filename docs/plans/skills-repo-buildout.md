# Plan: Central AI Coding-Agent Skills Repo

**Goal:** one private source of truth for agent skills that many City repos install and pin, with no drift, across Claude Code, Gemini CLI / Antigravity, and GitHub Copilot.
**Tooling:** [`vercel-labs/skills`](https://github.com/vercel-labs/skills) CLI (`npx skills`).

## Decisions

| Area | Decision |
|---|---|
| Distribution | Git source: `npx skills@1.7.6 add coa-internal/custom-dev-ai-skills#vX.Y.Z --skill <name> --copy`. No npm package. (Corrected in Phase 0: the ref goes after `#`. `@name` selects a skill.) |
| Hosting | ~~Private repo~~ **Public** repo in the City GitHub org (changed 2026-11-23 to remove the need for a CI credential). |
| Consumer commits | `skills-lock.json` **and** copied skill files (`--copy`), so cloud agents (Copilot coding agent, Claude on the web) can see them. |
| Versioning | Repo-wide semver tags (`v1.0.0`) + `CHANGELOG.md`. |
| Scope | Skills only (`SKILL.md` folders with optional `scripts/`, `references/`, `assets/`). No AGENTS.md, MCP, or plugin-marketplace sync for now. |
| Portability | Every skill must work as plain markdown in all three harnesses. Harness-specific frontmatter (e.g. Claude `allowed-tools`) is allowed. Scripts must be optional or cross-platform. Each skill declares its compatibility. |
| Governance | Anyone at the City can open a PR. Merges need dev-team approval via CODEOWNERS. Branch protection on `main`. |
| Central CI | Frontmatter/structure lint + install smoke test for all four agent targets. |
| Propagation | Manual. Consumers upgrade by re-running `add` at a new tag. |
| Consumer CI | **Blocking:** frozen-lockfile restore + `git diff --exit-code` (catches hand edits). **Non-blocking:** `skills check` posts a "newer release available" warning. |
| CI auth | None. The repo is public, so consumer CI fetches anonymously. (The GitHub App design was dropped.) |
| Local skills | Allowed in consumers only with a `local-` prefix. Central skill names may never start with `local-`. |
| Layout | Flat `skills/<name>/SKILL.md`. Group with name prefixes. README catalog is generated. |
| Seed content | 1–2 reference skills only. |
| Pilot | A single consuming repo. |
| Telemetry | `DISABLE_TELEMETRY=1` everywhere: CI workflow + dev setup docs. |

## Target layout (this repo)

```
custom-dev-ai-skills/
├── skills/
│   ├── skill-template/        # copy-me starter (metadata.internal: true)
│   └── <reference-skill>/     # 1 real, portable example
├── scripts/
│   ├── lint-skills.mjs        # frontmatter + structure rules
│   └── gen-catalog.mjs        # regenerates README catalog table
├── .github/
│   ├── CODEOWNERS             # * @<org>/dev-team
│   ├── pull_request_template.md
│   └── workflows/
│       ├── ci.yml             # lint + smoke install (PRs)
│       ├── release.yml        # on tag: GitHub Release from CHANGELOG
│       └── verify-skills.yml  # reusable (workflow_call) for consumers
├── docs/
│   ├── PLAN.md
│   ├── CONSUMING.md           # install / upgrade / local-skill rules
│   └── AUTHORING.md           # portability + semver rules
├── CHANGELOG.md
├── CONTRIBUTING.md
└── README.md                  # rewritten: no longer "an npm package"
```

## Phases

### Phase 0: Spike to verify CLI behavior (½ day, before building)
The docs left these open. Confirm each against a pinned CLI version:
1. With `-a claude-code gemini-cli antigravity github-copilot --copy`, does `add` write to both `.claude/skills/` and `.agents/skills/`? Does each harness actually load from its directory? Check Copilot in VS Code **and** the github.com coding agent.
2. After `add …@v1.0.0`, does `skills update` stay on the tag or jump to `main`? Is the upgrade path "re-run `add` at the new tag"?
3. With a tag pin, does `skills check` report newer tags, or only new commits on the pinned ref? This determines whether the non-blocking staleness job works as designed.
4. Does `install --frozen-lockfile` reproduce `--copy` installs byte-for-byte, so that `git diff --exit-code` is a valid drift check?
5. Pick a CLI version to pin (`npx skills@<x.y.z>`), since the tool moves fast and some commands are `experimental_`. Requires Node ≥ 22.20.

Record the findings in `docs/CONSUMING.md`. If item 3 fails, write a small script that compares the lockfile commit with the latest tag via `git ls-remote --tags`.

### Phase 1: Scaffold the central repo
- Rewrite README (purpose, catalog, quick start). Add CONTRIBUTING, AUTHORING, CONSUMING.
- `lint-skills.mjs` rules: valid YAML; `name` equals the folder name; `^[a-z0-9]+(-[a-z0-9]+)*$`; no `local-` prefix; description length within the strictest harness limit (1024 chars); unique names; relative links resolve; any `scripts/` are referenced from SKILL.md; `metadata.compatibility` present.
- `ci.yml`: lint → `npx skills add ./ --list` → install into a temp git repo for each agent target → assert expected files exist → `gen-catalog` produces no diff.
- Semver rules in AUTHORING.md:
  - **Major:** removing or renaming a skill, or breaking a script's interface.
  - **Minor:** adding a skill, or a description/trigger change that alters when a skill fires.
  - **Patch:** wording and fixes.
- CODEOWNERS for the dev team, branch protection (1 required review, CI required), tag protection for `v*`.

### Phase 2: Reference skills
- `skill-template/`: annotated starter, hidden from installs via `metadata.internal: true`.
- One real, portable skill. Choose a small one with low risk and high value; test it manually in all three harnesses.

### Phase 3: Consumer kit
- **GitHub App** (needs an org admin): read-only `contents`, installed only on this repo. Store the App ID and private key as org secrets/variables.
- **Allow reuse:** in this repo, go to Settings → Actions → Access → "Accessible from repositories in the organization", so private repos can call `verify-skills.yml`.
- **`verify-skills.yml`** (`workflow_call`):
  - Setup: Node 22.20+, `DISABLE_TELEMETRY=1`, mint an App token, `git config url."https://x-access-token:${TOKEN}@github.com/".insteadOf`.
  - Job `integrity` (blocking): `npx skills@<pin> install --frozen-lockfile` → `git diff --exit-code -- .claude/skills .agents/skills`.
  - Job `staleness` (non-blocking, `continue-on-error`): `skills check` → `::warning::` + step summary.
- **`docs/CONSUMING.md`:** first-time install command, upgrade command, the `local-` rule, how to upstream a local skill, and telemetry setup for developers (shell profile / direnv).

### Phase 4: Pilot (single repo)
- Install the reference skill(s) and add the workflow caller (about 10 lines).
- Success criteria: all three harnesses discover and use the skill; a hand edit fails CI; tagging `v1.0.1` centrally produces a staleness warning; an upgrade PR is a clean diff.
- Capture friction and fix it before v1.0.0.

### Phase 5: v1.0.0 and wider rollout
- Tag `v1.0.0`. Announce with CONSUMING.md. Onboard repos on request.
- Revisit deferred items as needed: automated update PRs, a shared AGENTS.md, MCP configs, a Claude plugin marketplace manifest, behavioral evals, secrets/PII scanning.

## Risks / notes
- **Duplicate copies:** skills land in both `.claude/skills/` and `.agents/skills/`. That is acceptable because both are hash-checked. Revisit if Claude Code starts reading `.agents/skills/` natively.
- **CLI churn:** pin the CLI version in the reusable workflow and docs, and bump it deliberately.
- **Missing secrets scan in CI:** reviewers must check that no PII, credentials, or internal hostnames land in skills. Consider adding gitleaks later.
- **Public records:** skills and this repo may be subject to N.C.G.S. §132 retention and requests. Write accordingly.
- **AI disclosure:** this plan was drafted with AI assistance (Claude Code). Verify the details, especially the Phase 0 items, before acting on them.

## Status (2026-11-23)

- **Phase 0: done**, except the manual check that each harness loads skills (folded into the Phase 4 pilot). Findings are in [CONSUMING.md](../CONSUMING.md#cli-behavior-notes-phase-0). Item 3 failed as anticipated: `skills check` does not see newer tags. The staleness job uses `git ls-remote --tags`. Item 4 differs from the plan: `experimental_install` restores only `.agents/skills/`. The drift check also `diff -r`s `.claude/skills/` against the restored copy.
- **Phase 1: done in repo.** Org-admin settings still needed: `coa-dev-team` repo access (team created), branch protection and tag protection.
- **Phase 2: done**: `skill-template` and `git-pr-description`. Manual harness testing is still pending.
- **Phase 3: workflow and docs done.** The repo is going public instead of using a GitHub App, so no credential setup is needed.
- **Phases 4–5: not started.**
