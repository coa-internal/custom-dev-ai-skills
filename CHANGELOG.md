# Changelog

All notable changes to this repo. Versions follow the semver rules in
[docs/AUTHORING.md](docs/AUTHORING.md). Each `## [X.Y.Z]` section becomes the GitHub Release notes
for tag `vX.Y.Z`.

## [Unreleased]

### Added
- Repo scaffold: skill linter, README catalog generator, install smoke test, CI and release workflows.
- Reusable `verify-skills.yml` workflow for consuming repos (frozen-lockfile drift check and
  staleness warning).
- `git-pr-description` skill: drafts PR descriptions in the City PR template format.
- `skill-template` (internal): annotated starter for new skills.
- Docs: CONSUMING.md (including verified `skills@1.7.6` CLI behavior), AUTHORING.md, CONTRIBUTING.md.
- SECURITY.md with private reporting instructions.

### Changed
- The repo is public. `verify-skills.yml` no longer needs a GitHub App or secrets, and callers drop
  `secrets: inherit`.
