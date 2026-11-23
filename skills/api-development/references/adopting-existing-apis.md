# Adopting an existing API

Use this for APIs built code-first, on another framework or language, or before these conventions
existed. The goal is a committed, enforced contract first, then gradual alignment. Not a rewrite.

## Principles

- **Work within the existing stack** unless the developer asks for a migration. Conventions,
  security rules and the review checklist apply to any stack. The Express/Lambda/Terraform details
  only apply if the API already uses them.
- **Don't break current consumers.** Renaming fields to snake_case, adding `/v1`, or changing error
  shapes in place are breaking changes. City conventions go into the *next* major version, or into
  new endpoints only.
- **Document reality first, improve second.** The first spec describes what the API actually does,
  quirks included.

## Steps

1. **Inventory.** List routes, methods, auth, request and response shapes, error formats and known
   consumers. Read the routing code. Don't rely on memory or old docs.
2. **Get a spec.**
   - If the framework can emit OpenAPI (FastAPI, ASP.NET Core, NestJS, Spring with springdoc,
     express-jsdoc annotations), export it and convert or downgrade it to 3.0.x.
   - Otherwise write `openapi.yaml` by hand from the code.
   - Mark the spec's description: `Spec extracted from the existing implementation on YYYY-MM-DD.`
3. **Prove the spec matches.** Add contract tests that call the real app and validate responses
   against the spec. Fix the spec (not the code) until they pass, unless you've found a genuine bug.
4. **Commit and enforce.** Add Spectral linting and the `oasdiff` breaking-change check to CI. From
   now on, every change starts in the spec ([openapi.md](openapi.md)).
5. **Add request validation** if the stack supports it (for Node, `express-openapi-validator`).
   Start in report-only or test-only mode if strict validation could reject requests clients
   currently send. Plan the switch with the developer.
6. **Review security** with [security-privacy.md](security-privacy.md) and report findings by
   severity. Fix blockers first (exposed PII, missing auth, injection).
7. **Plan convergence** with the developer: which conventions to adopt in new endpoints now, and
   which wait for `/v2` ([versioning-deprecation.md](versioning-deprecation.md)).

## Migrating to the City stack (only if asked)

If the developer wants to move an API onto Express + Lambda + Terraform:

1. Freeze the extracted spec as the contract.
2. Scaffold from the starter and implement the same contract, including quirks, so consumers see
   no change.
3. Run the old and new contract tests against both implementations.
4. Cut over behind the same hostname, or announce the new endpoint, with a rollback plan.
5. Retire the old implementation with the developer's go-ahead.
