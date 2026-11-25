# 0002. Use trunk-based branches with tagged releases

- **Status:** Proposed
- **Date:** 2026-11-25
- **Deciders:** Dev team
- **Drafted with AI:** Yes (Claude Code, Claude Opus 5.5), adapted from a pilot repository's ADRs
- **Rules:** GIT-001 to GIT-016 (`skills/dev-standards/references/git.md`)

## Context

City repositories need one way of working that suits features of every size, hotfixes, and
AI-assisted drafting, with a person accountable for every change that reaches production. A pilot
repository tried a `development` and `main` pair with release pull requests; when pull requests were
squash-merged the two branches diverged, and every release needed workarounds.

AI tools draft much of the code. City policy requires a person to review it and requires disclosure
of AI use.

## Decision

- **One long-lived branch, `main`, always releasable** (GIT-001). All work happens on short-lived
  `feature/`, `epic/` and `hotfix/` branches (GIT-003) and reaches `main` only through a reviewed
  pull request with passing checks (GIT-002).
- **Small pull requests** of about 400 changed lines (GIT-004). Larger features are built as
  vertical slices (GIT-008) on an epic branch that syncs with `main` often and has a draft pull
  request open from day one (GIT-009).
- **AI disclosure belongs in the pull request** (GIT-005, GIT-006), naming the tool and model.
- **No City default merge method** (GIT-007). Different repositories call for different approaches,
  so each repository chooses merge commits, squash or rebase merging, records the choice in its
  `AGENTS.md`, and enforces it in its GitHub settings. A City default can be added later if one
  emerges.
- **Releases are semantic version tags on `main`** created by release maintainers (GIT-010,
  GIT-011). Production deploys only from a tag, behind an approval gate (GIT-012), and promotes the
  build that ran on staging (GIT-013). Every release has reviewed notes (GIT-014).
- **Hotfixes** are ordinary branches from `main` shipped as PATCH releases (GIT-015). **Rollback**
  redeploys the previous tag (GIT-016).

Feature flags are not part of the City default. A project that needs them records that in a project
ADR, because flags change what "releasable" means for that repository.

## Consequences

- "Merged" and "in production" are different states; the latest tag says what is live.
- History looks different from one repository to the next. Tools and skills that read history (for
  example, to draft release notes) check `AGENTS.md` for the merge method first.
- Branch protection, tag rulesets and the production environment are GitHub settings an
  administrator applies per repository; they cannot live in the repository itself.
- Epic branches can drift from `main`. The sync rule, the early draft pull request and the four-week
  check-in exist to catch that.
- Slices on an epic are reviewed twice: into the epic, and when the epic merges into `main`.
- This repository currently squash-merges. Under GIT-007 it records that choice in its `AGENTS.md`
  and restricts its GitHub settings to squash merging.

## Alternatives considered

- **`development` and `main` with a release pull request (git-flow style)**: two long-lived branches
  diverge under squash merging, and releasing needs back-merges.
- **A City default merge method** (merge commits, with other methods as recorded deviations): one
  less decision per repository, but repositories differ enough (applications, documentation, skills)
  that many would deviate. Can be added later if the team settles on one.
- **A default by kind of repository**: more nuance, but harder to state and to classify
  repositories.
- **Feature flags to merge unfinished work into `main`**: keeps branches short, but adds flag code
  and cleanup discipline. Left to projects.
- **Stacked pull requests**: weak tool support and hard to maintain.
- **Per-pull-request preview environments**: avoid contention for a single staging environment, but
  depend on each project's hosting design. Left to projects.
