---
# REQUIRED. Must equal this folder's name. Lowercase letters, digits and single hyphens; max 64 chars.
# Group related skills with a shared prefix (e.g. git-, gis-, data-). Never start with "local-".
name: skill-template
# REQUIRED. Max 1024 chars. This is what the agent reads to decide WHEN to load the skill, so lead
# with what it does, then say "Use when ..." with the concrete triggers. Changing this is a MINOR bump.
description: Annotated starter for new City of Asheville agent skills. Copy this folder, rename it, and replace every section. Not installable.
metadata:
  # REQUIRED. Comma-separated harnesses you have tested this skill in.
  # Allowed: claude-code, gemini-cli, antigravity, github-copilot
  compatibility: claude-code, gemini-cli, antigravity, github-copilot
  # Hides this skill from `skills add --list` and `--skill '*'`. Delete this line in real skills.
  internal: true
# OPTIONAL, harness-specific. Claude Code (and some others) honor allowed-tools; the rest ignore it.
# The skill must still work when this field is ignored.
# allowed-tools: Read Grep
---

# Skill title

<!--
Write the body as plain markdown instructions to an AI coding agent. Every harness (Claude Code,
Gemini CLI / Antigravity, GitHub Copilot) loads this file as-is, so do not rely on features only one
harness has. Keep it short: aim for under ~300 lines and move long material into references/.
This repo and installed skills may be public records (N.C.G.S. §132). Never include PII,
credentials, tokens, internal hostnames or IPs, or privileged/confidential content.
-->

One or two sentences on what this skill helps the agent do and why.

## When to use

- Concrete situation that should trigger this skill.
- Another one. Say when NOT to use it if there is a likely false trigger.

## Steps

1. First thing the agent should do.
2. Next thing. Be specific about inputs, outputs and where files go.
3. How to verify the result.

## Reference material

Put long or optional material in `references/` and link it with a relative path, for example
[the example reference](references/example.md). Links must stay inside this folder, because only
this folder is copied into consuming repos.

## Scripts (optional)

If you add `scripts/`, every script must be referenced from this file (e.g. `scripts/check.mjs`),
be optional or cross-platform (prefer Node.js over bash/PowerShell), and the skill must still be
useful when the agent cannot run it.
