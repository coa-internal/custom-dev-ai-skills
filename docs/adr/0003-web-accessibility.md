# 0003. Build web applications to WCAG 2.1 AA with automated checks

- **Status:** Proposed
- **Date:** 2026-11-25
- **Deciders:** Dev team
- **Drafted with AI:** Yes (Claude Code, Claude Opus 5.5), adapted from a pilot repository's ADRs
- **Rules:** A11Y-001 to A11Y-010 (`skills/dev-standards/references/accessibility.md`)

## Context

The City publishes web applications for the public. The U.S. Department of Justice's ADA Title II
web rule sets WCAG 2.1 Level AA as the technical standard for state and local government web
content. Many City applications are map-based, and maps drawn on a canvas or as image tiles are hard
or impossible to use with assistive technology.

City staff use many City applications that the public never sees. Staff members and contractors with
disabilities need those applications to work with assistive technology just as much as residents
need public sites to.

AI tools draft much of the UI code. They make common accessibility mistakes, and they will try to
make a failing check pass by suppressing it unless told not to.

This ADR records an engineering standard. It is not a legal determination; questions about the
City's legal obligations go to the City Attorney's Office.

## Decision

- **Target WCAG 2.1 Level AA** for everything we ship (A11Y-001).
- **Every web application is in scope**, whether it serves the public or only staff. Staff-only
  applications follow the same rules; staff are users too.
- **Automated checks block merging**: axe-core in end-to-end tests and, where available, a strict
  accessibility linter (A11Y-002), scanning every significant page state (A11Y-003).
- **Suppressions are narrow, explained and approved by a person**, and AI tools never add one to get
  a check to pass (A11Y-004).
- **Semantic HTML first** (A11Y-005), with tested component libraries for complex widgets
  (A11Y-007).
- **Every map has an equivalent list or table view** (A11Y-006).
- **Every user-facing feature has a keyboard-only acceptance criterion** and a test (A11Y-008).
- **Tests find elements the way users do** (A11Y-009), and people test with a screen reader
  periodically (A11Y-010).

## Consequences

- Accessibility appears in acceptance criteria, tests and pull request review for every UI change.
- Automated checks find only part of what WCAG covers. Manual keyboard and screen-reader testing
  remain human work.
- False positives happen. The suppression rule makes them visible and reviewable instead of silent.
- Map features cost more to build because each needs a list view, and that view needs tests.

## Open questions for the dev team

- **Review**: the ADA coordinator and the City Attorney's Office should review this standard before
  it is accepted, because it states a City-wide requirement.
- **Accessibility statements**: whether each public application publishes one, and in what form.

## Alternatives considered

- **WCAG 2.2 AA**: a superset of 2.1 AA. A reasonable stretch goal once 2.1 AA is routine.
- **Public-facing applications only**: less work on internal tools, but it leaves out staff with
  disabilities, and internal tools are often opened to the public later.
- **Manual audits only**: catch more than automated tools, but too slow to run on every change.
- **WebGL map libraries without a list view**: faster for very large datasets, but features drawn on
  the canvas are invisible to assistive technology.
