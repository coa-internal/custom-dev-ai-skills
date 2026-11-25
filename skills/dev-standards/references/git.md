# Git workflow and releases

Applies to every participating City of Asheville repository hosted on GitHub. The reasoning behind
these rules is in the central repository's
[ADR 0002](https://github.com/coa-internal/custom-dev-ai-skills/blob/main/docs/adr/0002-git-workflow-and-releases.md).
The `git-workflow` and `git-release` skills walk through them step by step.

**Roles.** The **dev team** is the GitHub team that reviews and approves changes (named in
`CODEOWNERS`). A **release maintainer** is a dev team member allowed to create release tags and
approve production deployments.

## Branches

### GIT-001 (MUST) `main` is the only long-lived branch and is always releasable

Everything merged to `main` can ship to production as it is. Unfinished work stays on a feature or
epic branch. A repository that wants to merge unfinished work hidden behind a feature flag records
that decision in a project ADR first.

### GIT-002 (MUST) Every change reaches `main` through a reviewed pull request

No direct pushes to `main`. Branch protection on `main` requires a pull request, at least one
approval from the dev team by someone other than the author, and every blocking check. It blocks
force pushes and branch deletion. AI tools commit only on working branches, and push, merge, or open
pull requests only when a person asks them to.

### GIT-003 (SHOULD) Name branches `feature/<name>`, `epic/<name>`, or `hotfix/<name>`

Use short kebab-case names. Slices of an epic are `feature/<epic>-<slice>`. Shared prefixes let CI
and deployment workflows match branch types the same way in every repository.

## Pull requests

### GIT-004 (SHOULD) Keep pull requests under about 400 changed lines

The count excludes lockfiles, generated files, and seed or fixture data. A larger pull request says
why in its description.

### GIT-005 (MUST) Pull request descriptions disclose AI assistance

When AI drafted any part of the change, the description says so and names the tool and model. City
policy requires disclosing AI use. Use the repository's pull request template; the
`git-pr-description` skill drafts one.

### GIT-006 (SHOULD) Keep AI disclosure in the pull request, not in commit trailers

Commits carry no `Co-Authored-By` or similar AI trailers. Trailers differ by tool and are easy to
miss; the pull request names the tool and model in one consistent place.

### GIT-007 (SHOULD) Choose the repository's merge method and record it in AGENTS.md

The City sets no default merge method; different repositories call for different approaches. Each
repository picks merge commits, squash merging or rebase merging, states the choice in `AGENTS.md`
so people and AI tools follow it, and allows only that method in the repository's GitHub settings.
Recording the reason in a project ADR is optional.

- **Merge commits** keep every reviewed commit in history, which helps trace a change step by step.
- **Squash merging** gives one commit per pull request and a short, readable history.
- **Rebase merging** gives a linear history without merge commits, but every commit on the branch
  must stand on its own.

## Larger features

### GIT-008 (SHOULD) Build large features as vertical slices, one pull request per slice

Each slice works end to end (data, API, UI, tests) and has its own acceptance criteria, so it can be
reviewed and tested on its own.

### GIT-009 (SHOULD) Use an epic branch for features that need more than one slice

Cut `epic/<name>` from `main`. Slices merge into the epic by pull request under the same review and
check rules as `main`. Open a draft pull request from the epic into `main` on the first day so CI
runs on the combined change. Merge `main` into the epic at least twice a week and before the final
review. After about four weeks, the team checks in on the epic (re-slice, split, or reduce scope);
this is a prompt, not a hard stop.

## Releases

### GIT-010 (MUST) Production releases are semantic version tags on `main`

A release is a `vMAJOR.MINOR.PATCH` tag on a commit already on `main`. A person chooses the bump:
PATCH for fixes, MINOR for new user-visible features, MAJOR for breaking changes. Only release
maintainers create `v*` tags, and a released tag is never moved or deleted (enforce with a tag
ruleset).

### GIT-011 (SHOULD) Start at `v0.1.0` and make `v1.0.0` the first public release

Versions below 1.0.0 signal a pilot or pre-release.

### GIT-012 (MUST) Production deployments run only from a release tag, with release-maintainer approval

For repositories that deploy, the release tag starts the production workflow. That workflow uses a
protected GitHub Environment whose required reviewers are release maintainers.

### GIT-013 (SHOULD) Deploy every merge to staging and promote the tested build to production

Production receives the same build that was tested on staging, not a rebuild. The project's hosting
ADR says how.

### GIT-014 (MUST) Every release has release notes reviewed by a person

Notes come from `CHANGELOG.md` or are drafted from the changes since the previous tag. AI may draft
them; a person reviews them before the release is published.

### GIT-015 (SHOULD) Ship hotfixes from a `hotfix/<name>` branch as a new PATCH release

Branch from `main`, merge through a fast-tracked pull request (GIT-002 still applies), and tag a new
PATCH version. No back-merge is needed: open epics pick up the fix the next time they merge `main`.

### GIT-016 (SHOULD) Roll back by redeploying the previous release tag

Do not move or delete tags to roll back. If the fix needs code, ship it as a hotfix.
