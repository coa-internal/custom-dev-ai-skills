# Web accessibility

Applies to every web page and web application built or maintained in City of Asheville repositories,
whether it serves the public or only City staff. The reasoning behind these rules is in the central
repository's
[ADR 0003](https://github.com/coa-internal/custom-dev-ai-skills/blob/main/docs/adr/0003-web-accessibility.md).
The `web-accessibility` skill walks through building and testing to them.

These rules are engineering practice, not a legal determination. Automated checks find only part of
what WCAG covers, so passing them does not by itself show that a page conforms. Send questions about
the City's legal obligations to the City Attorney's Office.

## Target

### A11Y-001 (MUST) Meet WCAG 2.1 Level AA

WCAG 2.1 AA is the minimum for everything we ship, staff-only applications included. The U.S.
Department of Justice's ADA Title II web rule uses it as the technical standard for state and local
government web content.

## Automated checks

### A11Y-002 (MUST) Automated accessibility checks block merging

End-to-end tests run axe-core with the `wcag2a`, `wcag2aa`, `wcag21a`, and `wcag21aa` tags, and any
violation fails CI. Where the framework has an accessibility linter (for React,
`eslint-plugin-jsx-a11y` in `strict` mode), it runs in CI with zero warnings.

### A11Y-003 (MUST) Scan every significant page state, not only the first load

Run axe on each state a user can reach: open dialogs and menus, form error states, and alternate
views such as a map's list view.

### A11Y-004 (MUST) Keep suppressions narrow, explained, and approved by a person

Never turn a rule off globally or exclude a whole page. Dismiss a confirmed false positive at one
element or one line, with a written reason, and get it approved in pull request review. A real
violation that cannot be fixed yet is tracked as an issue, not hidden. AI tools never add a
suppression to make a check pass; they fix the code or ask.

## Design and build

### A11Y-005 (MUST) Build with semantic HTML first

Use native elements before ARIA. Every view has a skip link to the main content, a visible focus
indicator, and exactly one `h1`. Every form control has a programmatic label. Color is never the
only way information is conveyed.

### A11Y-006 (MUST) Give every map an equivalent non-map view

A list or table shows the same results as the map, stays in sync with it, and works by keyboard and
screen reader. People who cannot see or operate the map can complete the same task. Map markers have
accessible names, and popups contain semantic HTML.

### A11Y-007 (SHOULD) Build complex widgets on an accessible component library

Comboboxes, dialogs, tabs, menus, and similar widgets use a tested library (for React, React Aria
Components) instead of hand-written ARIA and keyboard handling.

## Acceptance and testing

### A11Y-008 (MUST) Give every user-facing feature a keyboard-only acceptance criterion

The feature's acceptance criteria include completing the task with the keyboard alone, and at least
one test proves it.

### A11Y-009 (SHOULD) Find elements in tests the way users do

Select by role, label, and visible text (`getByRole`, `getByLabel`) before test IDs or CSS
selectors. Tests then break when the accessible interface breaks.

### A11Y-010 (SHOULD) Test with a screen reader periodically

People test key tasks with the keyboard and at least one screen reader from time to time, because
automated tools miss problems such as confusing reading order or unhelpful labels.
