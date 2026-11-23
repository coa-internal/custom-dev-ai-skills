# Contributing

Anyone at the City of Asheville can propose a new skill or a change. The dev team reviews and merges.

## Workflow

1. Create a branch (City staff with write access) or fork the repo. **This repo is public.** Anything
   you push, including branches, commits and PR text, is visible to everyone immediately and can't
   be fully deleted afterward.
2. Add or change a skill under `skills/<name>/`. For a new one, copy
   [`skills/skill-template/`](skills/skill-template/SKILL.md), rename the folder and `name`, and
   delete the `internal: true` line.
3. Follow [docs/AUTHORING.md](docs/AUTHORING.md): frontmatter rules, portability and safety.
4. Run the checks locally (Node.js ≥ 22.20):

   ```bash
   export DISABLE_TELEMETRY=1
   npm ci
   npm run lint
   npm run catalog   # updates the README table; commit the result
   npm run smoke
   ```

5. Test the skill by hand in every harness you list in `metadata.compatibility`.
6. Add a line under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md) and say whether it is a
   major, minor or patch change (see AUTHORING.md).
7. Open a PR and fill in the template. Merging needs one approval from `@coa-internal/coa-dev-team`
   (CODEOWNERS) and a passing CI.

## Review checklist (for reviewers)

- No PII, credentials, internal hostnames/IPs, privileged content, or security-sensitive internal
  procedures. GitHub secret scanning catches many credentials, but not the rest. Reviewers must check.
- `description` clearly says when the skill should and shouldn't fire.
- Works as plain markdown in the listed harnesses. Scripts are optional or cross-platform.
- The semver bump in the changelog is right.

## Notes

- Content here may be a public record under N.C.G.S. §132.
- If you used AI to draft a skill or PR, say so in the PR (City AI policy). Verify AI-drafted content
  before you submit it.
- Questions about whether something is allowed: ask the dev team, or IT Services
  (help@ashevillenc.gov).
