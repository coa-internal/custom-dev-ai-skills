---
name: dev-standards
description: City of Asheville software development standards - numbered MUST and SHOULD rules for git workflow and releases (GIT-), web accessibility (A11Y-) and file formatting (FMT-), with the baseline .editorconfig and Prettier config and a script that writes a one-line-per-rule digest into AGENTS.md. Use when checking whether a change, plan or repository follows City standards, when a rule ID such as GIT-010 or A11Y-006 comes up, when a project wants to deviate from a standard or needs a waiver, when setting up or fixing formatting in a repository, or when adding or updating the standards digest in AGENTS.md.
metadata:
  compatibility: claude-code, gemini-cli, antigravity, github-copilot
---

# City development standards

The City's shared engineering rules, as numbered requirements. Each rule has an ID (`GIT-001`), a
level (**MUST** or **SHOULD**), and a one-line summary, followed by its full text.

| Standard                    | File                                                       | Prefix |
| --------------------------- | ---------------------------------------------------------- | ------ |
| Git workflow and releases   | [references/git.md](references/git.md)                     | `GIT`  |
| Web accessibility           | [references/accessibility.md](references/accessibility.md) | `A11Y` |
| File formatting             | [references/formatting.md](references/formatting.md)       | `FMT`  |
| Levels, deviations, waivers | [references/deviations.md](references/deviations.md)       |        |

## Ground rules

- **MUST** rules apply in every repository they cover, unless the repository records an approved
  waiver. **SHOULD** rules are the City default; a repository may deviate by recording a project ADR
  that cites the rule ID. Details: [references/deviations.md](references/deviations.md).
- **Check the repository first.** Its `AGENTS.md` and `docs/adr/` may record deviations or waivers.
  Those take precedence over a SHOULD rule for that repository.
- **Cite rule IDs** when you point out a problem or explain a choice ("GIT-002: this needs a pull
  request"), so a person can look the rule up.
- **Propose, don't decide.** If a request conflicts with a MUST rule, say so and stop. Do not decide
  on your own that a deviation or waiver is justified; a person does. Never edit this skill's files
  in a consuming repository: CI fails, and changes belong in the central repository.
- **Not legal advice.** These are engineering standards. Questions about legal obligations (for
  example ADA requirements) go to the City Attorney's Office.

## Check a change or plan against the standards

1. Work out which standards apply (git, accessibility for web UI, formatting for any file).
2. Read the relevant reference files in full. The `AGENTS.md` digest has summaries only.
3. Check the repository's recorded deviations and waivers.
4. Report each finding as: rule ID, level, what is wrong, and a suggested fix. Separate MUST
   findings from SHOULD findings.

## Add or update the standards digest in AGENTS.md

The digest puts one line per rule into `AGENTS.md`, so every AI session sees the rule IDs without
loading the full standards. Run it from the repository root after installing or upgrading this
skill:

```bash
node .agents/skills/dev-standards/scripts/agents-digest.mjs
```

The script (`scripts/agents-digest.mjs`) adds the digest at the end of `AGENTS.md` the first time,
and replaces it between its `<!-- dev-standards:start -->` and `<!-- dev-standards:end -->` markers
after that. It reads the pinned version from `skills-lock.json`. Options: `--check` exits 1 when the
digest is missing or out of date (use it in CI), `--print` prints the digest without writing, and
`--file <path>` targets another file. Move the block elsewhere in `AGENTS.md` if you like; the
script finds it by its markers. Commit the result.

If the script cannot run, copy each `### <ID> (<LEVEL>) <summary>` heading from the reference files
into a bulleted list in `AGENTS.md` by hand.

## Set up formatting in a repository

Follow [references/formatting.md](references/formatting.md). In short:

1. Copy [assets/editorconfig.baseline](assets/editorconfig.baseline) to `.editorconfig` (FMT-001).
2. Install Prettier 3 as a dev dependency and create `prettier.config.mjs` that spreads
   [assets/prettier-base.json](assets/prettier-base.json) (FMT-002). Adding Prettier is a dependency
   change; say so in the pull request.
3. Add the vendored and generated paths to `.prettierignore` (FMT-004).
4. Reformat everything in one formatting-only pull request and add its commit to
   `.git-blame-ignore-revs` (FMT-007).
5. Add to CI, as required checks (FMT-003):

   ```bash
   npx prettier --check .
   node .agents/skills/dev-standards/scripts/check-formatting.mjs
   node .agents/skills/dev-standards/scripts/agents-digest.mjs --check
   ```

`scripts/check-formatting.mjs` confirms that `.editorconfig` starts with the baseline, that
Prettier's effective options match the City base for each kind of file, and that vendored skill
folders and `skills-lock.json` are ignored. It also warns, without failing, when `package.json` does
not pin Prettier to an exact version (FMT-002). It needs Prettier installed in the repository.

## Reminders

- These files may be public records (N.C.G.S. §132). So may the pull requests and ADRs that cite
  them.
- Verify AI-drafted changes against the rule text before acting on them.
