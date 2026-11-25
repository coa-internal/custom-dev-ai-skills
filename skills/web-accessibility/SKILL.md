---
name: web-accessibility
description: Builds, tests and reviews City of Asheville web pages and apps for accessibility (WCAG 2.1 AA) - semantic HTML, keyboard and screen-reader support, map list views, axe-core checks in Playwright tests, eslint-plugin-jsx-a11y, and how to handle a failing accessibility check. Use when creating or changing web UI, adding a map, writing end-to-end tests for a page, writing acceptance criteria for a user-facing feature, fixing an axe or jsx-a11y failure, or reviewing UI code for accessibility.
metadata:
  compatibility: claude-code, gemini-cli, antigravity, github-copilot
---

# Web accessibility (City of Asheville)

Help developers build and test web UI that meets WCAG 2.1 Level AA. The rules are the `A11Y-` rules
in the `dev-standards` skill (`references/accessibility.md`); this skill is the how-to. Rule IDs are
cited in brackets.

## Ground rules (always)

- **Fix, don't suppress.** Never disable an accessibility rule, exclude an element, or add an
  `eslint-disable` to make a check pass [A11Y-004]. If you believe a finding is a false positive,
  explain why and let the developer decide.
- **Don't claim conformance.** Passing automated checks does not show that a page meets WCAG. Say
  what was checked and what still needs a person (keyboard and screen-reader testing). Questions
  about legal obligations go to the City Attorney's Office.
- **No real personal data** in test fixtures or screenshots. Use synthetic data.

## Building UI

Apply these to every view you create or change [A11Y-005]:

- Use native elements first: `<button>` for actions, `<a href>` for navigation, `<label>` for form
  controls, `<table>` for tabular data, landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`).
- One `h1` per view; headings in order without skipping levels.
- A skip link to `<main>` as the first focusable element.
- A visible focus indicator on everything focusable. Never remove outlines without a replacement.
- Every form control has a programmatic label; errors are announced and tied to their field
  (`aria-describedby`), and color is never the only signal.
- Images have meaningful `alt` text, or `alt=""` if decorative.
- For comboboxes, dialogs, tabs, menus, and similar widgets, use the project's accessible component
  library (for React, React Aria Components) instead of hand-written ARIA [A11Y-007].

## Maps

Every map has an equivalent non-map view [A11Y-006]:

- A list or table of the same results, in sync with the map's filters and selection.
- Reachable and usable by keyboard and screen reader, with the same tasks possible as on the map.
- Markers have accessible names; popups contain semantic HTML.
- Acceptance criteria and tests cover the list view, not only the map.

## Acceptance criteria

For each user-facing feature, include at least one criterion of the form "A keyboard-only user can
…" for the main task, and a test that proves it [A11Y-008].

## Testing

- Run axe in end-to-end tests with the WCAG 2.1 A and AA tags, and fail on any violation [A11Y-002].
  Scan each significant state, not only the first load: open dialogs and menus, form errors, and a
  map's list view [A11Y-003]. A helper for Playwright is in
  [references/axe-playwright.md](references/axe-playwright.md).
- Select elements the way users find them: `getByRole`, `getByLabel`, visible text. Use test IDs
  only when there is no accessible handle [A11Y-009].
- For React, run `eslint-plugin-jsx-a11y` in `strict` mode with zero warnings [A11Y-002].

## When an accessibility check fails

1. Read the rule and the failing element. Most findings are real: fix the markup.
2. If it still looks like a false positive, explain the evidence to the developer. Only they decide.
3. If they approve a suppression, make it as narrow as possible, with a reason a reviewer can judge
   [A11Y-004]:
   - ESLint: `// eslint-disable-next-line jsx-a11y/<rule> -- <reason>` on that one line.
   - axe: exclude one element by selector, or disable one rule for one scan, with a reason (see the
     helper in [references/axe-playwright.md](references/axe-playwright.md)).
4. If it is a real problem that cannot be fixed now, suggest opening an issue instead of hiding it.
5. Call out every suppression in the pull request description so the reviewer approves it.

## Reminders for the developer

- Automated checks catch only part of WCAG. Test key tasks with the keyboard and a screen reader
  periodically [A11Y-010].
- Verify AI-drafted UI and tests yourself before merging.
