# Consuming skills in a City repository

How to install skills from `coa-internal/custom-dev-ai-skills`, keep them pinned, upgrade them, and
add repo-specific skills.

**Pinned CLI:** `skills@1.7.6` (Node.js ≥ 22.20). Use this exact version in commands and CI. It is
bumped deliberately in this repo. See [CLI behavior notes](#cli-behavior-notes-phase-0).

## One-time developer setup

The `skills` CLI sends anonymous telemetry unless it is disabled. Turn it off in your shell profile
(`~/.zshrc`, `~/.bashrc`) or in the repo's `.envrc` if you use direnv:

```bash
export DISABLE_TELEMETRY=1
```

This repo is public, so no credentials are needed to install skills.

## First-time install

From the root of the consuming repo:

```bash
npx skills@1.7.6 add coa-internal/custom-dev-ai-skills#v1.0.0 \
  --skill git-pr-description \
  -a claude-code gemini-cli antigravity github-copilot \
  --copy -y
```

- **`#v1.0.0` is the version pin.** The ref goes after `#`. Do not write `@v1.0.0`: in this CLI,
  `owner/repo@name` means "the skill called *name*", not a git ref.
- Pass `--skill` once per skill, or list several: `--skill a b c`. To see what's available, run
  `npx skills@1.7.6 add coa-internal/custom-dev-ai-skills#v1.0.0 --list`.
- `--copy` writes real files instead of symlinks, so cloud agents (Copilot coding agent, Claude on
  the web) can read them.
- With these agents the CLI writes **two** copies: `.claude/skills/<name>/` (Claude Code) and
  `.agents/skills/<name>/` (Gemini CLI, Antigravity and GitHub Copilot all read this one). CI checks
  both.

Commit everything the command wrote:

```bash
git add skills-lock.json .claude/skills .agents/skills
git commit -m "Add agent skills from custom-dev-ai-skills v1.0.0"
```

Then add the CI check below.

## CI check

Create `.github/workflows/skills.yml`:

```yaml
name: Agent skills
on: [pull_request]
jobs:
  skills:
    uses: coa-internal/custom-dev-ai-skills/.github/workflows/verify-skills.yml@v1.0.0
```

Make the **"Skills match lockfile"** check required in branch protection. It is a blocking job that:

1. Enforces the lockfile policy. Every central skill is pinned to a `vX.Y.Z` tag, every folder in
   `.claude/skills/` or `.agents/skills/` is either in `skills-lock.json` or named `local-*`, and every
   locked skill is committed.
2. Restores the skills from `skills-lock.json` with `--frozen-lockfile`. This fails if the
   lockfile's hash doesn't match the content at the pinned tag.
3. Fails if any committed copy, in `.agents/skills/` or `.claude/skills/`, differs from the
   restored content. That catches hand edits, added files and deleted files.

A second job, **"Newer skills release available"**, is non-blocking. It posts a warning and a job
summary when a newer release tag exists than the one you pinned.

The workflow needs no secrets. It fetches from this public repo anonymously.

We also recommend adding the skill paths to your repo's CODEOWNERS so the dev team sees any change
to them:

```text
/skills-lock.json  @coa-internal/coa-dev-team
/.claude/skills/   @coa-internal/coa-dev-team
/.agents/skills/   @coa-internal/coa-dev-team
```

`local-*` skills sit under the same folders, so this also routes them to the dev team. Narrow it to
specific skill folders if that's too much review.

## Upgrading

`npx skills update` **does not** move you to a newer release. It re-fetches the tag you already
pinned. To upgrade, re-run the install command at the new tag:

```bash
npx skills@1.7.6 add coa-internal/custom-dev-ai-skills#v1.1.0 \
  --skill git-pr-description \
  -a claude-code gemini-cli antigravity github-copilot \
  --copy -y
```

Read the [CHANGELOG](../CHANGELOG.md) first. A major version can remove or rename skills. Review the
diff: it should touch only `skills-lock.json` and the skill folders. Open a PR with the result. Also
bump the `verify-skills.yml@vX.Y.Z` ref in your caller workflow when the changelog says the workflow
changed.

## Repo-specific (local) skills

You can add skills that only make sense in one repo, as long as the folder name starts with
**`local-`**, for example `.claude/skills/local-deploy-runbook/SKILL.md`. Central skill names may never
start with `local-`, so the two can't collide. CI ignores `local-*` folders. Do not run
`npx skills add` for them and keep them out of `skills-lock.json`.

Do not edit a central skill in place. CI will fail. If you need different behavior, either write a
`local-` skill or improve the central one (below).

### Upstreaming a local skill

If a `local-` skill would help other teams:

1. Copy its folder into `skills/<new-name>/` in this repo, dropping the `local-` prefix. Use a
   group prefix such as `git-` or `gis-`.
2. Follow [AUTHORING.md](AUTHORING.md): add `metadata.compatibility`, remove repo-specific paths and
   anything sensitive, and test it in each harness you list.
3. Open a PR here. Once it ships in a release, install it in your repo with `npx skills add` and
   delete the `local-` copy.

## CLI behavior notes (Phase 0)

Verified on 2026-11-23 against `skills@1.7.6` with a scripted spike. A local bare repo stood in for
GitHub through a `git config url.<x>.insteadOf` rewrite, the same mechanism the CI workflow uses.
Re-check these when bumping the CLI.

| # | Question | Finding |
|---|---|---|
| 1 | Where does `add -a claude-code gemini-cli antigravity github-copilot --copy` write? | Copies to `.claude/skills/<name>/` and `.agents/skills/<name>/`, plus `skills-lock.json`. Gemini CLI, Antigravity and Copilot all map to `.agents/skills/` in the CLI's agent table. **Still to verify manually:** that each harness loads from its directory, including Copilot in VS Code and the github.com coding agent (Phase 4 pilot). |
| 2 | Does `skills update` stay on a tag pin? | **Yes.** The lockfile records `"ref": "v1.0.0"`, and `update` re-clones at that ref, so it never moves to a newer tag or to `main`. The upgrade path is to re-run `add` at the new tag. That produces a clean diff (lockfile `ref` + `computedHash`, and the changed skill files). |
| 3 | Does `skills check` report newer tags? | **No.** It only compares content at the *pinned* ref, so it stays silent after `v1.1.0` is released. (`check` exists but is missing from `--help` in 1.7.6.) The staleness job therefore uses `git ls-remote --tags` and compares the pinned ref with the highest `vX.Y.Z` tag. |
| 4 | Does `install --frozen-lockfile` reproduce `--copy` installs byte-for-byte? | The command is `experimental_install`. It restores **only** into `.agents/skills/`, never `.claude/skills/`. It **skips** skills that already have a `SKILL.md` unless you pass `--force`. It does verify content against `computedHash` and exits 1 on mismatch. The restored `.agents` copy is byte-identical to `add --copy`. The CI job deletes the locked `.agents` folders, restores, runs `git status` on `.agents/skills/`, and `diff -r`s each `.claude/skills/<name>/` against the restored copy. |
| 5 | Which CLI version to pin? | `1.7.6` (released 2026-11-03). `install` and `sync` are `experimental_`-prefixed and may change. |

Other observations:

- Skills with `metadata.internal: true` are hidden from `--list` and from `--skill '*'`, but they
  **can** still be installed by naming them explicitly. Treat `internal` as "not advertised", not
  "blocked".
- For private GitHub sources the CLI tries git credentials, then `gh`, then SSH. `GITHUB_TOKEN` and
  `GH_TOKEN` are used for API lookups. This repo is public, so none of that applies, but it matters
  if you install from a private source.
