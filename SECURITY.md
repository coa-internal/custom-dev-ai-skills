# Security

## Reporting a problem

If you find a security problem in this repo, report it privately: a credential, personal data,
internal system details, or a skill that tells an agent to do something unsafe.

- Use GitHub's **private vulnerability reporting**: the **Security** tab → **Report a vulnerability**.
- Or email City of Asheville IT Services at help@ashevillenc.gov.

Please don't open a public issue or pull request for these. Anything posted publicly stays visible
even after deletion.

## What's in scope

- Skill content in `skills/`. It is loaded into AI coding agents with the user's permissions.
- Scripts in `scripts/` and `skills/*/scripts/`.
- The GitHub Actions workflows in `.github/workflows/`, including the reusable `verify-skills.yml`
  that other repositories call.

## Notes for users of these skills

Skills are instructions to AI agents. Review a skill before installing it, pin it to a release tag
as described in [docs/CONSUMING.md](docs/CONSUMING.md), and verify AI-generated output before you
rely on it.
