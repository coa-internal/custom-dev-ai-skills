# Security and privacy

Use this for design, implementation and reviews. City APIs may be internal or public, so assume
hostile input either way.

## OWASP API Security Top 10 (2023) checklist

| # | Risk | What to check in this stack |
|---|---|---|
| API1 | Broken object-level authorization | IAM proves which *service* is calling, not which records it may see. If data belongs to specific residents, departments or cases, the handler must check the caller may access *that* record. Never trust IDs from the client alone. |
| API2 | Broken authentication | Non-public operations rely on gateway IAM (no `security: []` by accident). No home-made tokens or shared passwords. Secrets are in Secrets Manager/SSM. |
| API3 | Broken object property-level authorization | Request schemas use `additionalProperties: false` and explicit fields (no mass assignment). Response schemas list only fields the caller may see; internal fields never appear. |
| API4 | Unrestricted resource consumption | `limit` has a maximum. Strings, arrays and bodies have size limits. Throttling is set, and public APIs consider CloudFront + WAF. Upstream and database calls have timeouts. Expensive queries (spatial, full-text) are bounded. |
| API5 | Broken function-level authorization | Admin or write operations are separate routes so IAM policies can allow them per caller. Public and internal operations are not mixed on one path without explicit `security`. |
| API6 | Unrestricted access to sensitive business flows | Flows that can be abused at volume (submissions, lookups that enumerate people or addresses) get stricter limits, and their design is reviewed with the developer. |
| API7 | Server-side request forgery | The API never fetches URLs supplied by clients. If it must, use an allowlist of hosts and block private and metadata IP ranges. |
| API8 | Security misconfiguration | `helmet` on, `x-powered-by` off, no stack traces or internal messages in errors, CORS lists exact origins only, debug logging off in prod. |
| API9 | Improper inventory management | The spec lists every route (the gateway rejects others). Deprecated operations are marked. Old versions have an owner and a removal plan. |
| API10 | Unsafe consumption of APIs | Responses from upstream systems are validated and mapped, never passed through. Upstream errors are not exposed. Timeouts and limits apply. |

## Personal data (PII) and public records

- **Minimize.** Ask whether each personal field is needed. Prefer IDs over names, and neighborhoods
  or rounded locations over exact addresses where possible.
- **Never put PII in URLs or query strings.** They end up in logs, caches and browser history. Use
  POST bodies for searches by personal attributes.
- **Never log PII**, bodies, tokens or credentials. The starter logs only the method, path, status
  and request ID.
- **Classify the data.** For new APIs, ask the developer what kinds of data it exposes and whether
  any are confidential under state or federal law (for example health, criminal justice or
  personnel data). Escalate unclear cases to the developer; they may need the City Attorney's
  Office.
- **Public APIs** must expose only data that is already public, or approved for release.
- **Public records:** API code, specs, logs and stored data may be subject to N.C.G.S. §132 and
  retention schedules. Don't design features to avoid records obligations. Confirm log retention
  with the developer.
- Test and example data are synthetic, always.

## Secrets

- Only in AWS Secrets Manager or SSM Parameter Store (SecureString).
- Never in code, `openapi.yaml`, tests, Terraform variables, `.tfvars`, environment variable values
  in Terraform, commit messages or PR descriptions.
- The Lambda role gets read access to specific secret ARNs only.
- If you find a committed secret, stop. Tell the developer it must be rotated; deleting it from the
  file isn't enough.

## CORS and headers

- CORS is configured on API Gateway with exact origins. Never `*` with IAM-protected operations.
- `helmet` defaults are fine for JSON APIs. Don't disable headers without a reason in a comment.

## Dependencies

- Keep dependencies few and pinned (`package-lock.json` committed, `npm ci` in CI).
- Check advisories (`npm audit --omit=dev`) when adding or upgrading packages, and prefer
  well-maintained packages.
