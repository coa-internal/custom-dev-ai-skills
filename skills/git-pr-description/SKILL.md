---
name: git-pr-description
description: Drafts a pull request description in the City of Asheville PR format (Plan, Evidence, Review checklist) from the current branch's changes. Use when the user asks to write, draft, fill in or update a PR description, PR body or pull request summary, or is about to open a pull request.
metadata:
  compatibility: claude-code, gemini-cli, antigravity, github-copilot
---

# Pull request description (City of Asheville format)

Draft a pull request description that follows the City's standard PR template, based on what the
branch actually changes. The human author reviews and edits it before posting.

## When to use

- The user asks for a PR description, PR body, or summary for a pull request.
- The user is about to open a PR and has not written a description yet.

Do not use this to review code or to decide whether a PR should merge.

## Steps

1. **Find the template.** If the repository has `.github/pull_request_template.md` (or
   `.github/PULL_REQUEST_TEMPLATE.md`, or `docs/pull_request_template.md`), use its headings and
   checklist exactly. Otherwise use the default in [references/template.md](references/template.md).
2. **Gather facts from the branch, not from memory.** Determine the base branch (usually `main`) and
   look at the commits and the diff against it (for example `git log <base>..HEAD` and
   `git diff <base>...HEAD --stat`, then the full diff for the files that matter). Read any linked
   issue or plan the user mentions.
3. **Fill in each section** using the guidance below. Keep it concise and factual. Use the repo's
   real paths and names.
4. **Never invent evidence.** Leave workflow-run links and scan results as `TODO:` placeholders unless
   the user gave them to you or you can see them. Leave every checklist box unchecked. Checking them
   is the reviewers' job.
5. **Flag sensitive content.** If the diff appears to contain credentials, tokens, personal data about
   residents, or internal hostnames/IPs, stop and tell the user before drafting. Do not copy those
   values into the description.
6. **Add the disclosure line** at the end: `_This description was drafted with AI assistance and
   reviewed by the author._` City policy requires disclosing AI use.
7. **Output the description as markdown** for the user to paste or to pass to `gh pr create --body-file`.
   Do not create or edit the PR unless the user explicitly asks you to.

## Section guidance

- **Goal:** one sentence on the outcome for users or operators, not a list of files.
- **Scope (paths/files):** the top-level paths touched, grouped (e.g. `src/api/`, `infra/`). Call out
  anything outside the obvious scope.
- **Steps:** the logical changes in the order a reviewer should read them.
- **Success criteria (verifiable):** checks someone else can run or observe, such as tests, commands,
  or a URL with the expected result. Keep the template's existing checkboxes.
- **Risks + mitigations:** what could break, who would notice, and what limits the blast radius.
  Write "Low: <reason>" rather than leaving it empty.
- **Rollback / escalation plan:** how to undo (revert the PR, a feature flag, a migration down-step)
  and who to contact if it goes wrong.

## Reminders for the author

Mention these briefly after the draft, not inside it:

- PR descriptions in City repositories may be public records (N.C.G.S. §132). Write accordingly.
- Verify every statement against the diff before posting. AI drafts can be wrong.
