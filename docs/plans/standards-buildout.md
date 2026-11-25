# Plan: City development standards in the skills repo

**Goal:** give City repositories one controlled source for City-wide engineering rules (git
workflow, accessibility, formatting to start), delivered through the existing pinned skill install,
so projects stop copying and re-arguing the same ADRs, and AI tools load a short digest instead of
every ADR.

**Status:** proposed. Drafted with AI assistance (Claude Code, Claude Opus 5.5) from a pilot
repository's ADRs. Verify the details before acting on them.

## Decisions

| Area             | Decision                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope            | Grows from "skills only" to "skills and the standards they carry". Still no shared `AGENTS.md` sync: projects generate a digest block themselves.                     |
| Standards        | Live in the `dev-standards` skill, one file per area in `references/`. Installed, pinned and drift-checked like any skill.                                            |
| Rule format      | One heading per rule: `### GIT-010 (MUST) Summary`. Permanent IDs, never reused. Levels MUST and SHOULD.                                                              |
| Deviations       | SHOULD: project ADR citing the ID and version. MUST: waiver issue in this repo, approved by the dev team. See `dev-standards/references/deviations.md`.               |
| Indentation      | Tabs wherever a language allows them, so each developer chooses the indent width they read best (ADR 0004).                                                           |
| A11y scope       | Every web application, public-facing or staff-only (ADR 0003).                                                                                                        |
| Merge method     | No City default. Each repo chooses, records it in `AGENTS.md` and enforces it in GitHub settings (GIT-007, ADR 0002). A default can be added later.                   |
| Reasoning        | ADRs in this repo's `docs/adr/`, not installed. Standards link to them.                                                                                               |
| Digest           | `dev-standards/scripts/agents-digest.mjs` writes one line per rule into a project's `AGENTS.md`; `--check` runs in CI.                                                |
| How-to skills    | `git-workflow`, `git-release`, `web-accessibility` cite rule IDs. `git-pr-description` already covers pull request descriptions.                                      |
| Formatting       | One EditorConfig and Prettier baseline for every City repo, this one included (ADR 0004). `dev-standards/scripts/check-formatting.mjs` checks a repo's configuration. |
| Versioning       | Standards follow the repo-wide semver. New or tighter MUST rule: major. SHOULD changes: minor. Wording: patch.                                                        |
| Self-application | This repo follows the standards it publishes, or records a deviation.                                                                                                 |

## Pull requests, in order

### 1. Standards, ADRs and skills (minor, v0.3.0)

- Add `skills/dev-standards/`, `skills/git-workflow/`, `skills/git-release/`,
  `skills/web-accessibility/`.
- Add `docs/adr/` (README, template, ADRs 0001 to 0004) and this plan.
- Update `README.md`, `AGENTS.md` (then `npm run agents:sync`), `docs/AUTHORING.md`,
  `docs/CONSUMING.md`, `CONTRIBUTING.md` and `CHANGELOG.md` for the wider scope.
- Optional: have CI run `node skills/dev-standards/scripts/agents-digest.mjs --print` so a duplicate
  or malformed rule ID fails the build.
- Test each new skill by hand in every harness listed in its `metadata.compatibility`, or narrow the
  list to the harnesses actually tested.

### 2. Adopt the formatting baseline here (patch)

- Add `prettier` as a dev dependency. Reason: FMT-002 requires it, and `check-formatting.mjs` needs
  it to resolve options. No alternative meets the standard.
- Add `prettier.config.mjs`, `.prettierignore` and `.editorconfig` (from the baseline).
- Wrap the README catalog in `<!-- prettier-ignore-start -->` / `<!-- prettier-ignore-end -->`, or
  `catalog:check` fails after formatting.
- Add `format` and `format:check` scripts, and add `npm run format:check` and
  `node skills/dev-standards/scripts/check-formatting.mjs` to `npm test` and `ci.yml`.
- Reformat in one formatting-only commit (about 55 files: scripts, the `api-development` starter and
  Markdown) and add that commit to `.git-blame-ignore-revs`.
- Add `src/generated/` to the `api-development` starter's own `.prettierignore` (or document it), so
  projects created from the starter do not reformat generated types.
- This changes the bytes of installed skills, so consumers see a content diff on upgrade even though
  behavior is unchanged. Call that out in the changelog.

### 3. Repository settings (dev team, GitHub admin)

- Record this repo's merge method in `AGENTS.md` and allow only that method in its GitHub settings
  (GIT-007). The history currently shows squash merges.
- Apply branch protection and a `v*` tag ruleset if not already done (GIT-002, GIT-010).

### 4. Pilot in one consuming repository

- Install `dev-standards` and the how-to skills at the new tag; run the digest script; add
  `agents-digest.mjs --check` and `check-formatting.mjs` to its CI.
- Replace that repository's copies of the git, accessibility and formatting ADRs with short project
  ADRs that keep only project details and recorded deviations.
- Measure the AI context before and after.

### 5. Later candidates

From the pilot repository's ADRs, in rough order of value: the AI-assisted development rules
(human-owned areas, data handling, disclosure), model-agnostic AI tooling (`AGENTS.md` as the single
source, `.ai/` handoff notes), CI quality gates as a reusable workflow, the testing strategy, and
TypeScript conventions.

## Open questions for the dev team

1. **Accessibility review.** The ADA coordinator and the City Attorney's Office should review ADR
   0003 before it is accepted.
2. **Waivers.** Issues in this repo, approved by the dev team, are the starting process. Revisit
   after the first few waivers to see whether it needs more structure (an issue template, a review
   date, a list of active waivers).
3. **Rule numbering.** Is a three-digit number per area enough, or should IDs carry a version?
4. **Who runs the digest.** Projects run it after each upgrade. Should `verify-skills.yml` also run
   `--check`, so that a stale digest fails the same required check?

## Verification so far

Done on a local copy of this repository and a scratch consuming repository, 2026-11-25:

- `npm run lint`, `npm run catalog` and `npm run smoke` pass with the four new skills; all four
  agent targets install them.
- After adopting the baseline (PR 2 contents) and reformatting: `prettier --check .`, `lint`,
  `catalog:check`, `agents:check`, `smoke` and `check-formatting.mjs` all pass.
- `agents-digest.mjs`: writes, is idempotent, `--check` fails when missing or stale, rejects
  duplicate IDs and a missing marker, handles CRLF, and its output passes `prettier --check`.
- `check-formatting.mjs`: passes a compliant repository; reports a changed base option, a changed
  Markdown override, an edited `.editorconfig` baseline, and missing ignores, each with its rule ID.

Not yet done: manual testing of the new skills in each harness, and building and testing the
`api-development` starter after it is reformatted.
