---
name: git-workflow
description: Walks through the City of Asheville git workflow - starting a feature, hotfix or epic branch from main, committing in small reviewable steps, keeping epic branches in sync with main, sizing and opening pull requests, and merging. Use when the user starts new work, asks which branch to use or how to name it, plans a feature that needs several pull requests, needs to sync an epic branch, is about to open or merge a pull request, or asks how branching works in a City repository. For releases, tags and hotfix promotion use git-release instead.
metadata:
  compatibility: claude-code, gemini-cli, antigravity, github-copilot
---

# Git workflow (City of Asheville)

Help a developer move a change from idea to merged pull request the City's way. The rules are the
`GIT-` rules in the `dev-standards` skill (`references/git.md`); this skill is the how-to. Rule IDs
are cited in brackets.

## Ground rules (always)

- **Never commit to `main`** [GIT-001, GIT-002]. If the current branch is `main`, create a working
  branch before making any change.
- **Ask before anything shared.** Do not push, open, merge, or close pull requests, delete branches,
  or force-push unless the developer explicitly asks for that action. Never force-push a branch
  other people use (`main`, `epic/*`).
- **Check the repository's own choices** in `AGENTS.md` and `docs/adr/`: its merge method [GIT-007]
  and any recorded deviations. Deviations take precedence over SHOULD rules for that repository.

## Start work

1. Check the state: `git status` and `git branch --show-current`. Stop and ask if there are
   uncommitted changes that do not belong to the new work.
2. Decide the kind of work:
   - **One reviewable change** (most work): a feature branch.
   - **A fix that must reach production quickly**: a hotfix branch; then follow `git-release`.
   - **A feature that needs several pull requests**: an epic. Go to **Plan an epic** first.
3. Create the branch from an up-to-date `main` [GIT-003]:

   ```bash
   git switch main && git pull --ff-only
   git switch -c feature/<short-name>      # or hotfix/<short-name>
   ```

   Use short kebab-case names that describe the change (`feature/address-search`), not a ticket
   number alone.

## Commit

- Make small commits, each one a logical step a reviewer can follow, with an imperative subject line
  (`Add address search endpoint`).
- Do not add `Co-Authored-By` or other AI trailers [GIT-006]. AI disclosure goes in the pull
  request.
- Run the repository's checks before committing (see its `AGENTS.md` or `README`).

## Plan an epic

Use an epic when a feature is too big for one pull request of about 400 changed lines [GIT-004,
GIT-008, GIT-009].

1. **Slice vertically.** Help the developer split the feature into slices that each work end to end
   (data, API, UI, tests) and each have their own acceptance criteria. Avoid horizontal slices such
   as "all the database work first". Write the slices down where the repository keeps feature docs.
2. **Create the epic branch** and push it only when the developer asks:

   ```bash
   git switch main && git pull --ff-only
   git switch -c epic/<name>
   ```

3. **Open a draft pull request from the epic into `main` on day one**, so CI runs on the combined
   change. (The developer opens it, or asks you to.)
4. **Each slice** is a branch named `feature/<epic>-<slice>` cut from the epic, merged back into the
   epic by pull request with the same reviews and checks as `main`.
5. **Sync often.** Merge `main` into the epic at least twice a week and before the final review. Use
   a merge, not a rebase, because others share the branch:

   ```bash
   git switch epic/<name> && git pull --ff-only
   git merge origin/main
   ```

   If there are conflicts, show them to the developer and resolve them together; do not guess at
   another person's code.

6. **Finish.** When every slice's acceptance criteria are met, the epic pull request leaves draft.
   Its review focuses on how the slices fit together.
7. **Watch the age.** If the epic is older than about four weeks, suggest a team check-in: re-slice,
   split, or reduce scope [GIT-009].

## Open a pull request

1. Check the size against `main` (or the epic, for a slice), leaving out lockfiles and generated
   files:

   ```bash
   git diff --shortstat main...HEAD -- . ':(exclude)package-lock.json'
   ```

   Over about 400 changed lines: suggest splitting, or note the reason in the description [GIT-004].

2. Draft the description with the repository's pull request template. If the `git-pr-description`
   skill is installed, use it. The description must disclose AI assistance and name the tool and
   model [GIT-005].
3. Make sure the required checks pass. A pull request into `main` needs every blocking check and at
   least one approval from the dev team by someone other than the author [GIT-002].

## Merge

- Use the **merge method recorded in `AGENTS.md`** [GIT-007]. The City sets no default. If none is
  recorded, ask the developer which to use and suggest adding it to `AGENTS.md`.
- With squash merging, the pull request title becomes the commit message on `main`, so make sure it
  reads well on its own.
- Merge only when the developer asks, after approval and green checks.
- Delete the merged working branch only if the developer wants it deleted.

## Reminders for the developer

Mention briefly when relevant, not every time:

- Branch names, commits, and pull request text in City repositories may be public records (N.C.G.S.
  §132), and are visible to everyone in a public repository.
- Review AI-drafted commits and descriptions before pushing them.
