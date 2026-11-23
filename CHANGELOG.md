# Changelog

All notable changes to this repo. Versions follow the semver rules in
[docs/AUTHORING.md](docs/AUTHORING.md). Each `## [X.Y.Z]` section becomes the GitHub Release notes
for tag `vX.Y.Z`.

## [Unreleased]

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
