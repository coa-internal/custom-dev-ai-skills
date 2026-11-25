# 0004. Format every repository with one EditorConfig and Prettier baseline

- **Status:** Proposed
- **Date:** 2026-11-25
- **Deciders:** Dev team
- **Drafted with AI:** Yes (Claude Code, Claude Opus 5.5), adapted from a pilot repository's ADRs
- **Rules:** FMT-001 to FMT-007 (`skills/dev-standards/references/formatting.md`)

## Context

Files move between City repositories: skills are copied from this repository into projects, starter
projects are copied out of skills, and snippets travel in pull requests. When repositories format
differently, copied files fail the receiving repository's checks or get reformatted, and reformatted
skills then fail the drift check in `verify-skills.yml`. Review time also goes to style instead of
design.

A pilot repository settled its formatting in an ADR (Prettier, tabs, 100 columns, wrapped Markdown).
This repository currently has no formatter.

## Decision

- **One baseline for every City repository, including this one**: an `.editorconfig` that starts
  with the City block (FMT-001) and Prettier 3 with the City base options, which projects extend but
  do not change (FMT-002). The baseline files ship in the `dev-standards` skill's `assets/`.
- **CI enforces it** (FMT-003). The skill's `scripts/check-formatting.mjs` confirms that a
  repository's configuration is the City's, so `prettier --check` means the same thing everywhere.
- **Vendored and generated content is never reformatted** (FMT-004). Installed skills and lockfiles
  are in `.prettierignore`; generated blocks in Markdown sit inside Prettier ignore markers.
- **Other languages use their standard formatter** (FMT-005), and the baseline `.editorconfig`
  matches them (spaces for YAML, Python and Terraform).
- **Base options**: tabs displayed 2 columns wide, 100-column lines, single quotes in JS and TS,
  double quotes in JSX attributes, semicolons, Markdown wrapped at 100 columns, Prettier defaults
  for everything else.
- **Tabs everywhere a language allows them.** With tabs, each developer sets the indent width they
  read best in their own editor, which helps developers with low vision or dyslexia and anyone using
  a large font. Spaces fix one width for everyone.
- **`SKILL.md` frontmatter is never reformatted.** Without this, Prettier folds a long
  `description:` across lines. That is valid YAML, but not every agent harness parses folded
  frontmatter reliably.

## Consequences

- Copying a file between City repositories needs no reformatting, and installed skills always match
  their release.
- Each repository needs Prettier as a dev dependency, including this one.
- Adopting the baseline is a one-time, formatting-only pull request (FMT-007). In this repository it
  touches about 55 files, mostly scripts and the `api-development` starter, which switch from
  2-space indentation and double quotes to tabs and single quotes.
- Generators must produce output Prettier leaves alone, or sit inside ignore markers. This
  repository's README catalog needs ignore markers, or `catalog:check` fails after formatting.
- Wrapped Markdown means editing a sentence can reflow its paragraph in a diff.
- Changing a base option is a City-wide change, made here, not a local override.

## Alternatives considered

- **Spaces for indentation**: Prettier's default and this repository's current style. Tabs let each
  reader choose their indent width, which helps accessibility.
- **Each repository chooses its own formatting**: no central decision, but copied files break checks
  and installed skills drift.
- **A shared Prettier config published to npm**: the usual approach in JavaScript, but this
  repository is deliberately not an npm package, and the skill already delivers files at a pinned
  version.
- **`proseWrap: preserve`**: smaller Markdown diffs, but wrapping then depends on each author's
  editor.
- **Biome or dprint**: faster, but less complete Markdown and YAML support, and new to the team.
