# API and spec review checklist

Use when asked to review an API, a spec, or an API pull request. Read the spec first, then the code.

Report findings grouped by severity, each with the file and location, the problem, and a concrete
fix:

- **Blocker:** security or privacy exposure, a breaking change within a major version, a spec
  that doesn't match the code, or secrets or PII in the repo.
- **Should fix:** convention violations in new work, missing tests or error responses, weak limits.
- **Suggestion:** naming, docs and clarity improvements.

Say what you checked and what you couldn't (for example, deployed configuration).

## Contract

- [ ] OpenAPI 3.0.x. `npm run lint:spec` passes. Generated types are current (`gen:types:check`).
- [ ] No `x-amazon-apigateway-*` extensions, real hostnames or account IDs in the spec.
- [ ] Every operation has `operationId` (camelCase, stable), `tags`, `summary`, `description`.
- [ ] Every operation documents its success response and each error it can return. Errors use the
      shared Problem responses.
- [ ] Request bodies use `additionalProperties: false` and explicit `required`. Inputs have size
      and format limits.
- [ ] Response schemas list exactly the fields returned. No internal or sensitive fields.
- [ ] Examples are synthetic.

## Conventions ([conventions.md](conventions.md))

- [ ] Paths: `/v1` prefix, kebab-case, plural nouns, snake_case path parameters named for the
      resource.
- [ ] JSON fields and query parameters are snake_case. Timestamps are RFC 3339 UTC `*_at`. IDs are
      strings.
- [ ] Status codes fit the method (201 + `Location` on create, 204 on delete).
- [ ] Lists paginate: cursor by default, or the documented offset shape. `limit` max 100, stable
      sort order.
- [ ] Errors are `application/problem+json` with no stack traces or internal details.
- [ ] `GET /v1/health` exists and is public and cheap.

## Compatibility ([versioning-deprecation.md](versioning-deprecation.md))

- [ ] `oasdiff` shows no breaking changes within the current major version, or there is an agreed
      `/v2` plan.
- [ ] Behavior changes not visible in the spec (sorting, meanings) are called out.
- [ ] Deprecations carry `deprecated: true`, dates and a replacement, as agreed with the API owner.
- [ ] `info.version` bumped appropriately.

## Security and privacy ([security-privacy.md](security-privacy.md))

- [ ] Each operation's auth is intentional: IAM by default, `security: []` only where meant to be
      public.
- [ ] Object-level access is checked when data belongs to specific people or departments.
- [ ] Walk the OWASP API Top 10 table, and note each item as OK, issue, or not applicable.
- [ ] No PII in URLs, query strings, logs or examples. Public APIs expose only public data.
- [ ] Secrets only in Secrets Manager/SSM, and none in code, tfvars or history.
- [ ] CORS lists exact origins (none for service-to-service). `helmet` is on.
- [ ] Throttling is set. Public APIs have considered CloudFront + WAF.

## Implementation ([express-lambda.md](express-lambda.md), [data-access.md](data-access.md))

- [ ] Handlers use the generated types and stay thin. Data access is behind an interface.
- [ ] Parameterized queries only. No string-built SQL, sort fields or filters.
- [ ] Upstream calls have timeouts, mapped errors, and validated responses.
- [ ] Logs carry the request ID and nothing sensitive.
- [ ] Configuration comes from env vars and secrets from Secrets Manager/SSM.

## Tests ([testing.md](testing.md))

- [ ] Unit tests for logic. Contract tests (with response validation) for every operation's success
      and documented errors.
- [ ] Test data is synthetic. No tests hit shared environments.
- [ ] `npm run check` passes in CI.

## Infrastructure ([aws-terraform.md](aws-terraform.md))

- [ ] Modules preferred. Versions pinned. `terraform fmt` and `validate` pass.
- [ ] Backend uses the state key convention and `use_lockfile = true`. The bucket is not guessed.
- [ ] Lambda role is least privilege (specific table, secret and bucket ARNs).
- [ ] Runtime, Web Adapter layer and log retention are current and intentional.
- [ ] No secrets in variables or tfvars.
