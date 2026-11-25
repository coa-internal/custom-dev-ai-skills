# File formatting

Applies to every City of Asheville repository, including `custom-dev-ai-skills` itself. The goal is
that nobody thinks about formatting: every repository formats the same way, tools do the work, and
files copied between repositories never need reformatting. The reasoning is in the central
repository's
[ADR 0004](https://github.com/coa-internal/custom-dev-ai-skills/blob/main/docs/adr/0004-file-formatting.md).

The baseline files are in this skill's `assets/` folder:
[editorconfig.baseline](../assets/editorconfig.baseline) and
[prettier-base.json](../assets/prettier-base.json). In a repository that installs this skill, they
are at `.agents/skills/dev-standards/assets/`.

## Rules

### FMT-001 (MUST) Start `.editorconfig` with the City baseline

Copy `editorconfig.baseline` to `.editorconfig` at the repository root. Do not change anything above
its `# --- end of City baseline ---` line; add repository-specific sections below it. The baseline
uses tabs (shown 2 columns wide), and spaces where a language requires them or its standard
formatter uses them (YAML, Python, Terraform).

### FMT-002 (MUST) Format with Prettier 3 using the City base options unchanged

The repository's `prettier.config.mjs` spreads `prettier-base.json`. A repository may add plugins,
plugin options, and overrides for file types the base does not cover. It must not change a base
option. Example for a repository that installs this skill:

```js
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

const base = JSON.parse(
	readFileSync(
		new URL('./.agents/skills/dev-standards/assets/prettier-base.json', import.meta.url),
		'utf8',
	),
);

export default {
	...base,
	plugins: ['prettier-plugin-tailwindcss'],
	tailwindStylesheet: './apps/web/src/index.css',
	overrides: [...base.overrides],
};
```

SHOULD: pin Prettier to an exact version in `package.json`, with no `^` or `~` range (3.10.1 at the
time of writing), so every contributor and CI format identically. Upgrade it in a formatting-only
pull request (FMT-007), because a new version can reformat existing files. The check script fails
unless the major version is 3, and warns, without failing, when `package.json` lists Prettier with a
range or tag instead of an exact version.

### FMT-003 (MUST) CI checks formatting and blocks merging

CI runs `prettier --check .` as a required check, plus any formatter from FMT-005. It also runs this
skill's `scripts/check-formatting.mjs` (see the skill's instructions).

### FMT-004 (MUST) Never reformat vendored or generated files

`.prettierignore` lists at least:

```text
.agents/skills/
.claude/skills/
skills-lock.json
package-lock.json
```

plus build output and generated code (for example `dist/` or `src/generated/`). Vendored skills must
match their pinned release byte for byte, or the `verify-skills.yml` check fails. A generated
section inside a hand-written Markdown file sits between `<!-- prettier-ignore-start -->` and
`<!-- prettier-ignore-end -->`, so the generator's output and Prettier never disagree. Exclude the
same vendored paths from linters too, for the same reason.

### FMT-005 (SHOULD) Use the standard formatter for languages Prettier does not cover

For example `terraform fmt`, `ruff format` (Python), or `gofmt`. Run each in check mode in CI.

### FMT-006 (SHOULD) Format staged files before each commit

For example with `lint-staged` and a Husky pre-commit hook. CI is still the gate; the hook saves a
round trip.

### FMT-007 (SHOULD) Adopt or change the baseline in a formatting-only pull request

Reformat the whole repository in one pull request that changes nothing else, and add that commit to
`.git-blame-ignore-revs` so `git blame` skips it.

## Notes on the base options

- **Tabs, 2 columns wide.** Each reader can set their own indent width, which helps accessibility.
  Prettier still indents Markdown lists and YAML with spaces, because those formats need it.
- **100-column lines and wrapped Markdown** (`proseWrap: always`). Docs read the same in every
  editor. Editing a sentence can reflow its paragraph in a diff.
- **`SKILL.md` frontmatter is never reformatted** (`embeddedLanguageFormatting: off` for
  `SKILL.md`). Otherwise Prettier folds a long `description:` across lines. That is valid YAML, but
  not every agent harness parses folded frontmatter reliably. The body of `SKILL.md` is still
  formatted.
- **Everything else is Prettier's default** (for example `trailingComma: all`). A change to the base
  options goes through the central repository and an ADR update, not a local override.
