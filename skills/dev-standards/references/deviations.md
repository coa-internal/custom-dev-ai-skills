# Rule levels, deviations, and waivers

How a project applies the City standards, and what to do when it needs something different.

## Levels

| Level      | Meaning                                                    | When a project needs something else                      |
| ---------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| **MUST**   | Required in every repository the rule applies to.          | A **waiver**, approved by the dev team and recorded.     |
| **SHOULD** | The City default. Follow it unless there is a good reason. | A **deviation**, recorded in a project ADR.              |
| Unlisted   | Anything the standards do not cover.                       | The project decides, ideally in a project ADR if larger. |

## Recording a SHOULD deviation

Write a project ADR (in the project's `docs/adr/`) that cites the rule ID and the version of this
skill it was written against, says what the project does instead, and says why. For example:

```markdown
## Decision

Deviates from **GIT-013** (SHOULD, dev-standards v0.3.0): this repository has no staging
environment. It publishes a static documentation site, and each pull request's preview build serves
the same purpose.
```

List the deviation in the project's `AGENTS.md` too, so AI tools see it with the standards digest.

## Requesting a MUST waiver

A waiver is rare and usually temporary. Open an issue in the central repository that names the rule
ID, the repository, the reason, and an end date or condition. The dev team approves or declines it
there. If approved, the project records it in a project ADR that links the issue, and lists it in
`AGENTS.md`. Do not ask an AI tool to decide whether a waiver is justified; that is a human
decision.

## Rule IDs

- IDs have a prefix for the area (`GIT`, `A11Y`, `FMT`) and a three-digit number.
- An ID always means the same rule. Rewording is fine; changing what a rule requires is a new rule.
- A removed rule's ID is never reused. Removed IDs are listed under **Retired rules** at the end of
  their file.

## Versioning of standards

Standards ship in the central repository's single semantic version (see its `docs/AUTHORING.md`).
For standards:

| Bump      | When                                                                   |
| --------- | ---------------------------------------------------------------------- |
| **Major** | A MUST rule is added or tightened, or a rule is removed or renumbered. |
| **Minor** | A SHOULD rule is added or changed, or a MUST rule is relaxed.          |
| **Patch** | Wording and clarifications that do not change what any rule requires.  |

A major bump tells consuming projects that upgrading may require work before their checks pass.
