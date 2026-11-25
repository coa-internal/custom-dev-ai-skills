# 0001. Publish City development standards as a skill, with ADRs for the reasoning

- **Status:** Proposed
- **Date:** 2026-11-25
- **Deciders:** Dev team
- **Drafted with AI:** Yes (Claude Code, Claude Opus 5.5)
- **Rules:** all rules in `dev-standards`; rule levels in its `references/deviations.md`

## Context

City repositories have started recording engineering decisions as ADRs. Many of those decisions (git
workflow, accessibility, formatting) are the same in every repository, so each project copies and
re-argues them, and AI tools load every ADR into every session. In one pilot repository the ADRs
alone were about 15,000 tokens, most of it context and alternatives that a tool does not need in
order to follow a rule.

This repository already distributes skills to City repositories at pinned release tags, with a
reusable workflow that fails when an installed copy drifts from its release. Its plan scoped it to
skills only and deferred a shared `AGENTS.md`.

We want one controlled source for City-wide rules, without stopping projects from making their own
choices where the City has no reason to decide for them.

## Decision

1. **Rules and reasoning are separate.** A **standard** is a short, numbered rule. An **ADR** is the
   reasoning behind it. Skills are the step-by-step how-to.
2. **Standards live in the `dev-standards` skill**, one file per area under `references/`. They are
   installed, pinned and drift-checked like any other skill, so no new distribution mechanism is
   needed.
3. **Every rule has a permanent ID and a level**, written as a heading:
   `### GIT-010 (MUST) Production releases are semantic version tags on main`. IDs are never reused.
   Other skills, project ADRs and reviews cite the ID.
4. **Two levels.** **MUST** rules apply in every repository they cover; an exception needs a waiver
   approved by the dev team. **SHOULD** rules are City defaults; a project may deviate by recording
   a project ADR that cites the rule ID and version. Anything not covered is the project's choice.
5. **ADRs for City-wide standards live in this repository's `docs/adr/`.** They are not installed
   into projects. Standards link to them for anyone who wants the reasoning. Projects keep their own
   ADRs for project decisions and deviations.
6. **A generated digest goes into each project's `AGENTS.md`.** The skill's
   `scripts/agents-digest.mjs` writes one line per rule between markers, so every AI session sees
   the rule IDs and levels (a few hundred tokens) and loads the full text only when a task needs it.
   The project runs the script and commits the result; this repository does not write to other
   repositories.
7. **Standards follow the repository's semantic version.** Adding or tightening a MUST rule, or
   removing a rule, is a major change; SHOULD changes are minor; wording is a patch.
8. **This repository follows the standards it publishes**, or records a deviation the same way a
   project would.

## Consequences

- Projects adopt a standard by installing `dev-standards`, running the digest script, and adding its
  `--check` to CI. Upgrades arrive as a reviewable diff when a project moves to a new tag.
- A project's own `docs/adr/` shrinks to project decisions and recorded deviations.
- City-wide rule changes now go through this repository's review, not each project's.
- The scope of this repository grows from "skills only" to "skills and the standards they carry".
  The README, `AGENTS.md`, `AUTHORING.md` and `CONSUMING.md` need to say so.
- Skills cannot link outside their own folder, so other skills cite rules by ID and skill name
  instead of by link.
- Rule levels make review clearer, but someone must own waivers. The dev team does, through issues
  in this repository.

## Alternatives considered

- **A separate top-level `standards/` folder with its own sync script.** Clearer on GitHub, but
  needs a second installation and drift check alongside the `skills` CLI.
- **Link to standards on GitHub without installing them.** No copies, but no pinning, and AI tools
  cannot always fetch URLs.
- **Organization skills provisioned in one AI vendor's admin console.** Easy to roll out, but tied
  to one vendor and not pinned per repository.
- **An npm package of standards and configs.** Familiar for JavaScript projects, but this repository
  is deliberately not an npm package, and not every City repository uses npm.
- **Keep copying ADRs into each project.** No central work, but the rules drift apart and every AI
  session pays for the full text.
