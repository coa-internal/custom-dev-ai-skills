# Writing the OpenAPI spec

`openapi.yaml` at the API root is the contract. Reviewers read it before the code, and consumers,
generated types, runtime validation and API Gateway routes all come from it.

## Version: OpenAPI 3.0.x

Use `openapi: 3.0.3`. API Gateway HTTP APIs import 3.0, and the toolchain is built around it.
3.0 differs from 3.1:

| Need | 3.0 way (use this) | 3.1 way (don't) |
|---|---|---|
| Nullable value | `type: string` + `nullable: true` | `type: [string, "null"]` |
| Examples | `example:` on a schema, or `examples:` on media types | `examples: [...]` on schemas |
| Exclusive bounds | `exclusiveMinimum: true` + `minimum` | `exclusiveMinimum: 5` |
| Constant | `enum: [value]` | `const: value` |

## Structure

- `info`: `title`, `version` (the spec's semver, separate from the `/v1` major version),
  `description`, `contact.name` (team).
- `servers`: local development only (`http://localhost:8080`). Real hostnames are set at deploy
  time; don't commit internal hostnames.
- `tags`: one per resource, each with a `description`.
- Top-level `security: [{aws_iam: []}]` makes IAM the default. Public operations set
  `security: []`.
- `components`: `securitySchemes.aws_iam`, reusable `parameters` (`Limit`, `Cursor`), `schemas`,
  and `responses` (`BadRequest`, `NotFound`, `InternalError`, plus any others such as `Conflict`).
- **No AWS extensions** (`x-amazon-apigateway-*`) in the file. Terraform adds them at deploy time,
  so the contract stays vendor-neutral.

## Every operation has

- `operationId` in camelCase, unique and stable: `listServiceRequests`, `getServiceRequest`,
  `createServiceRequest`. Generated types use it, so renaming it breaks code.
- `tags`, a short `summary` and a `description`.
- Parameters defined once: path-level for path parameters, and `$ref`s for shared query parameters.
- Responses for success **and** each error the handler can return, using the shared Problem
  responses. Always include `500`. Include `400` whenever there are parameters or a body, and
  `404` for single-resource paths.

## Schemas

- Name schemas in PascalCase (`ServiceRequest`, `ServiceRequestPage`, `ServiceRequestCreate`).
- **Request bodies:** `additionalProperties: false`, explicit `required`, and separate create and
  update schemas when they differ. This blocks mass assignment (OWASP API3).
- **Responses:** list exactly the fields you return. Server-managed fields (`*_id`, `created_at`)
  appear in responses, not in create schemas (or are marked `readOnly: true`).
- Constrain inputs: `maxLength` on strings, `pattern` for IDs and codes, `minimum`/`maximum` on
  numbers, `maxItems` on arrays, `format` (`date-time`, `date`, `uuid`, `email`, `uri`).
- `example` values are synthetic. Never use real resident names, addresses, phone numbers, emails or
  case numbers.

## Linting

```bash
npm run lint:spec        # spectral lint openapi.yaml --fail-severity=warn
```

Spectral's built-in ruleset catches structural problems, missing descriptions and unused
components, but **not City conventions**. Check snake_case fields, kebab-case paths, the `/v1`
prefix, Problem responses and pagination shapes yourself (see
[review-checklist.md](review-checklist.md)).

## Generated types

```bash
npm run gen:types        # writes src/generated/openapi.ts
npm run gen:types:check  # fails if the committed file is stale (CI runs this)
```

Commit the generated file in the same change as the spec. Never edit it by hand.

## Breaking-change check

```bash
npm run breaking                          # oasdiff vs origin/main
BASE_REF=origin/release npm run breaking  # another base
```

CI runs the `oasdiff` GitHub Action on pull requests. A breaking change within `/v1` must be
redesigned as an additive change or moved to `/v2` ([versioning-deprecation.md](versioning-deprecation.md)).

## Docs

`npm run docs` renders `.docs/index.html` with Redocly for local viewing. API docs are not
published centrally yet, so don't set up hosting unless the developer asks.

## Large specs

Keep one file until it is hard to review (roughly 1,500+ lines). Then split `components` into files
referenced with relative `$ref`s, and bundle to a single file (`npx @redocly/cli bundle`) for type
generation and Terraform, which reads one file.
