---
name: git-release
description: Prepares City of Asheville releases - choosing the next semantic version, drafting release notes from the changes since the last tag, preparing the release tag for a release maintainer, shipping a hotfix, and rolling back to a previous release. Use when the user wants to cut, tag, version or promote a release, deploy to production, draft release notes or a changelog section, ship an urgent fix to production, or roll back a bad release. For everyday branching and pull requests use git-workflow instead.
metadata:
  compatibility: claude-code, gemini-cli, antigravity, github-copilot
---

# Releases (City of Asheville)

Help a release maintainer promote a tested commit on `main` to production. The rules are the `GIT-`
rules in the `dev-standards` skill (`references/git.md`), mainly GIT-010 to GIT-016. Rule IDs are
cited in brackets.

## Ground rules (always)

- **People release.** Prepare versions, notes and commands, but do not create or push tags, publish
  releases, approve deployments, or run production workflows unless a release maintainer explicitly
  asks you to. Only release maintainers create `v*` tags [GIT-010, GIT-012].
- **Never move or delete a released tag** [GIT-010]. Consumers and deployments depend on it.
- **Follow the repository's runbook** if it has one (`RELEASING.md`, `docs/AUTHORING.md`, or a
  `local-` skill). It says how this repository deploys; this skill covers the common steps.
- Deployment details, environments and access are often sensitive. Keep them out of public text.

## Cut a release

1. **Confirm what is being released.** Usually the tip of `main`. Ask the release maintainer whether
   it was tested on staging [GIT-013]. Check that CI passed on that commit.
2. **Find the previous release:**

   ```bash
   git fetch origin --tags
   git describe --tags --abbrev=0 --match 'v[0-9]*' origin/main
   ```

3. **List what changed since then.** How depends on the merge method recorded in `AGENTS.md`
   [GIT-007]. With merge commits, each merged pull request is one first-parent merge:

   ```bash
   git log --first-parent --merges --format='%h %s' <previous-tag>..origin/main
   ```

   With squash or rebase merging, use `git log --format='%h %s' <previous-tag>..origin/main`. If no
   method is recorded, check which kind of commits the history shows.

4. **Propose the version bump** and explain why [GIT-010]: MAJOR for breaking changes, MINOR for new
   user-visible features, PATCH for fixes only. Below `v1.0.0`, the release is a pre-release;
   `v1.0.0` is the first public release [GIT-011]. The release maintainer decides.
5. **Draft the release notes** [GIT-014]:
   - If the repository has a `CHANGELOG.md`, move the `Unreleased` entries under a new
     `## [X.Y.Z] - YYYY-MM-DD` heading. That change goes through a normal pull request first.
   - Otherwise draft notes grouped as Added, Changed, Fixed, Removed, in plain language for the
     people who use the application. Link pull request numbers.
   - Say that the notes were drafted with AI and need a person's review.
6. **Give the release maintainer the tag commands** for the exact commit:

   ```bash
   git tag -a vX.Y.Z <commit> -m "Release X.Y.Z"
   git push origin vX.Y.Z
   ```

7. **Production.** The tag starts the production workflow, which waits for approval from release
   maintainers in the protected GitHub Environment [GIT-012]. A release maintainer approves it.

## Ship a hotfix

1. Branch from `main` [GIT-015]:

   ```bash
   git switch main && git pull --ff-only
   git switch -c hotfix/<short-name>
   ```

2. Make the smallest fix that solves the problem, with a test that would have caught it.
3. Open a pull request into `main`. It still needs a review and green checks [GIT-002]; ask for a
   fast-tracked review.
4. After merge, cut a release with a PATCH bump (steps above). No back-merge is needed; open epic
   branches get the fix the next time they merge `main`.

## Roll back

1. Find the last good release tag (`git tag --list 'v*' --sort=-v:refname`).
2. Redeploy that tag using the repository's production workflow [GIT-016]; the release maintainer
   starts and approves it. Do not move or delete tags.
3. Fix forward with a hotfix, then release a new PATCH version.

## Reminders for the release maintainer

- Release notes and tags in City repositories may be public records (N.C.G.S. §132).
- Read AI-drafted release notes against the actual changes before publishing them.
