# Authoring skills

Rules for skills in this repo. `npm run lint` enforces the ones marked **(lint)**. Reviewers check
the rest.

## Layout

```
skills/<name>/
├── SKILL.md          # required: frontmatter + instructions
├── references/       # optional: longer docs the agent reads on demand
├── scripts/          # optional: helper scripts (see Portability)
└── assets/           # optional: templates, sample files
```

- Flat layout: one folder per skill directly under `skills/`. Group related skills with a name prefix
  (`git-`, `gis-`, `data-`, `infra-`) instead of subfolders.
- Start from [`skills/skill-template/`](../skills/skill-template/SKILL.md). It is annotated and hidden from installs.

## Frontmatter

```yaml
---
name: git-pr-description
description: What it does. Use when <concrete triggers>.
metadata:
  compatibility: claude-code, gemini-cli, antigravity, github-copilot
---
```

| Field | Rule |
|---|---|
| `name` | **(lint)** Required. Equals the folder name. Matches `^[a-z0-9]+(-[a-z0-9]+)*$`, max 64 chars, unique. Must **not** start with `local-` (reserved for consumer repos). |
| `description` | **(lint)** Required, non-empty, max 1024 chars (the strictest harness limit). This is what agents read to decide *when* to load the skill: say what it does, then "Use when …". |
| `metadata.compatibility` | **(lint)** Required. Comma-separated list of the harnesses you **tested** in: `claude-code`, `gemini-cli`, `antigravity`, `github-copilot`. |
| `metadata.internal` | **(lint)** Optional boolean. `true` hides the skill from `--list` and `--skill '*'`. Use it for templates and work in progress. |
| Harness-specific fields | Allowed, for example Claude Code's `allowed-tools`. The skill must still work in harnesses that ignore them. |

## Content

- **(lint)** Relative links in any `.md` file must resolve and stay inside the skill folder. Only that
  folder is copied into consuming repos.
- **(lint)** Every file in `scripts/` must be referenced from `SKILL.md` by its path
  (`scripts/foo.mjs`), so agents know it exists.
- Keep `SKILL.md` short (aim for under ~300 lines). Move detail into `references/`.
- Write plain markdown instructions that work in all three harnesses. Don't depend on one harness's
  tool names, slash commands or hooks.

## Portability

- Every skill must be usable as plain markdown in Claude Code, Gemini CLI / Antigravity and GitHub
  Copilot.
- Scripts must be **optional** (the skill still helps when they can't run) or **cross-platform**.
  Prefer Node.js (`.mjs`, no dependencies) over bash or PowerShell.
- Test the skill by hand in every harness listed in `metadata.compatibility` before requesting review.
  Note in the PR what you tried.

## Safety and records

- No PII about residents or employees, credentials, tokens, internal hostnames or IP addresses,
  privileged or confidential content. **This repo is public.** GitHub secret scanning and push
  protection catch many credentials, but reviewers must check everything else by hand. Keep
  security-sensitive procedures (deployment, access, incident response) in a `local-` skill in a
  private repo instead.
- Skills and their installed copies may be **public records** (N.C.G.S. §132). Write accordingly.
- Skills must not tell agents to make final decisions about people (eligibility, enforcement,
  benefits), give legal advice, or hide that AI was used. Where it matters, include a reminder that
  output must be verified by a person.

## Standards (`dev-standards`)

- One file per area in `skills/dev-standards/references/`. Each rule is a level-3 heading
  `### <PREFIX>-<NNN> (MUST|SHOULD) <one-line summary>` followed by its full text. The digest script
  reads only these headings, so keep the summary meaningful on its own.
- IDs are permanent. Rewording is fine; changing what a rule requires is a new rule. A removed rule
  moves to a **Retired rules** list at the end of its file, and its ID is never reused.
- Every standard has an ADR in `docs/adr/` with the reasoning. Change both in the same pull request.
- Other skills cite rules by ID and skill name (`GIT-002 in dev-standards`), not by link, because
  links must stay inside the skill folder.
- Versioning for standards is in `skills/dev-standards/references/deviations.md`.

## Versioning (semver, repo-wide)

One version covers the whole repo. Tags look like `vX.Y.Z`. Each release needs a `CHANGELOG.md`
entry.

| Bump | When |
|---|---|
| **Major** | A skill is removed or renamed, or a script's interface breaks (arguments, output format). Also a breaking change to `verify-skills.yml` inputs. |
| **Minor** | A skill is added, or a `description` / trigger change alters *when* a skill fires. New optional workflow inputs. |
| **Patch** | Wording, fixes, and clarifications that don't change when or how a skill fires. |

When in doubt, bump higher.

## Releasing (dev team)

1. Move the `Unreleased` entries in `CHANGELOG.md` under a new `## [X.Y.Z] - YYYY-MM-DD` heading.
   Merge that through a PR.
2. Tag the merge commit on `main`: `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. `release.yml` creates the GitHub Release from that changelog section. Tags are protected, so a
   released tag is never moved or deleted. Consumers' lockfile hashes depend on it.
