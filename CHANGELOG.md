# Changelog

All notable changes to this repo. Versions follow the semver rules in
[docs/AUTHORING.md](docs/AUTHORING.md). Each `## [X.Y.Z]` section becomes the GitHub Release notes
for tag `vX.Y.Z`.

## [Unreleased]

### Added
- `dev-standards` skill (**minor**): City development standards as numbered MUST/SHOULD rules for
  git workflow and releases (GIT-), web accessibility (A11Y-) and file formatting (FMT-), with the
  baseline `.editorconfig` and Prettier config, `scripts/agents-digest.mjs` (writes a rule digest
  into a repository's `AGENTS.md`) and `scripts/check-formatting.mjs`.
- `git-workflow`, `git-release` and `web-accessibility` skills (**minor**): step-by-step guidance
  that cites the `dev-standards` rules.
- `docs/adr/`: ADRs 0001 to 0004 explaining the standards, and `docs/plans/standards-buildout.md`.

### Changed
- `dev-standards` FMT-002 (**minor**): new SHOULD to pin Prettier to an exact version (currently
  3.10.1) and upgrade it in a formatting-only pull request (FMT-007). `check-formatting.mjs` warns
  when `package.json` lists Prettier with a range or tag. The warning does not change the exit code,
  and ADR 0004 is updated to match.

## [0.2.0] - 2026-11-23

### Added
- `api-development` skill (**minor**): builds and maintains City HTTP APIs (spec-first OpenAPI 3.0,
  TypeScript + Express on Lambda behind an API Gateway HTTP API, Terraform). Includes a tested
  starter project in `assets/starter/`. Tested by hand in Claude Code, Gemini CLI, Antigravity and
  GitHub Copilot. CI builds and tests the starter.
- Agent instructions for working on this repo: `AGENTS.md`, imported by `CLAUDE.md` and
  `GEMINI.md`, with a generated `.github/copilot-instructions.md` copy for Copilot code review.
  `npm run agents:sync` regenerates the copy; CI runs `npm run agents:check` to keep them in sync.

## [0.1.0] - 2026-11-23

First pre-release, for piloting in a single consuming repo before `1.0.0`.

### Added
- Repo scaffold: skill linter, README catalog generator, install smoke test, CI and release workflows.
- Reusable `verify-skills.yml` workflow for consuming repos (frozen-lockfile drift check and
  staleness warning). It needs no secrets, because this repo is public.
- `git-pr-description` skill: drafts PR descriptions in the City PR template format.
- `skill-template` (internal): annotated starter for new skills.
- Docs: CONSUMING.md (including verified `skills@1.7.6` CLI behavior), AUTHORING.md, CONTRIBUTING.md.
- SECURITY.md with private reporting instructions.
