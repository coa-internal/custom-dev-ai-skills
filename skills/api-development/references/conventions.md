# API conventions

Apply these to new APIs and new major versions. Don't retrofit them onto an existing version: that
would be a breaking change (see [versioning-deprecation.md](versioning-deprecation.md)).

## URLs

- Every path starts with the major version: `/v1/...`.
- **kebab-case**, **plural nouns** for collections: `/v1/service-requests`,
  `/v1/service-requests/{service_request_id}`.
- Path parameters are snake_case and named for the resource: `{service_request_id}`, not `{id}`.
- Nest at most one level, for true ownership: `/v1/permits/{permit_id}/inspections`. Otherwise link
  by ID.
- Actions that don't fit CRUD are sub-resources with a verb: `POST /v1/permits/{permit_id}/approve`.
  Use them sparingly.
- No trailing slashes, file extensions or query-string versions.

## JSON

- Fields and query parameters are **snake_case**: `created_at`, `request_type`.
- IDs are strings (even if numeric internally), so the storage can change without breaking clients.
- Timestamps: RFC 3339 in UTC with `Z`, named `*_at` (`created_at`). Dates without time: `YYYY-MM-DD`,
  named `*_on` or `*_date`.
- Enums are lowercase snake_case strings (`in_progress`). Adding an enum value can break strict
  clients, so document enums as extensible in the description when they may grow.
- Booleans read as statements: `is_active`, `has_attachments`.
- Money: integer minor units (`amount_cents`) or a string decimal, never floats.
- Geometry: GeoJSON, WGS 84 (EPSG:4326), longitude first.
- Omit nothing silently. A field is either always present (possibly `null`, marked `nullable: true`)
  or documented as optional.
- Top-level responses are objects, never bare arrays. That leaves room to add fields.

## Methods and status codes

| Operation | Method | Success |
|---|---|---|
| List | `GET /v1/things` | 200 with a page object |
| Read | `GET /v1/things/{thing_id}` | 200 |
| Create | `POST /v1/things` | 201 + `Location` header + the created resource |
| Replace | `PUT /v1/things/{thing_id}` | 200 with the resource |
| Partial update | `PATCH /v1/things/{thing_id}` (`application/merge-patch+json`) | 200 with the resource |
| Delete | `DELETE /v1/things/{thing_id}` | 204 |
| Accepted for async work | `POST ...` | 202 + a status URL |

Errors: 400 invalid input, 403 from API Gateway for IAM failures, 404 not found,
409 conflict (duplicate or state conflict), 412 failed precondition, 413 body too large,
415 wrong content type, 422 well-formed but semantically invalid (use sparingly; 400 is fine),
429 throttled (gateway), 500 unexpected, 502/503/504 upstream problems.

## Errors: RFC 9457 Problem Details

Every error response is `application/problem+json`:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "request/query/limit must be <= 100",
  "instance": "/v1/service-requests",
  "errors": [{ "path": "/query/limit", "message": "must be <= 100" }]
}
```

- `title` is the HTTP reason phrase for `about:blank`. Use a `type` URI only for documented,
  API-specific problem types.
- `detail` is safe for the caller to read. Never include stack traces, SQL, upstream responses,
  internal hostnames or other callers' data.
- `errors` (extension) lists field-level validation problems.
- In the spec, reference the shared `BadRequest`, `NotFound` and `InternalError` responses (add
  more such as `Conflict` the same way). The starter's `problemHandler` produces this shape.
- **Exception:** errors API Gateway returns before the request reaches Lambda are API Gateway's own
  `{"message": "..."}` JSON, not Problem Details. Examples: 403 for failed IAM auth, 404 for routes
  not in the spec, 429 for throttling, 503/504 when Lambda fails or times out. Tell client
  developers to handle both shapes for those status codes.

## Pagination

**Cursor (default):** request `?limit=&cursor=`. Response:

```json
{ "data": [ ... ], "next_cursor": "eyJhZnRlciI6InNyLTAwMDAzNSJ9" }
```

`next_cursor` is `null` on the last page. Cursors are opaque (base64url JSON in the starter), and
clients must not parse them. Validate decoded cursors and return 400 for bad ones.

**Offset (small or relational data only, when clients need page numbers or totals):** request
`?limit=&offset=`. Response:

```json
{ "data": [ ... ], "limit": 25, "offset": 50, "total_count": 132 }
```

Both styles: `limit` defaults to 25, maximum 100 (enforced in the spec), and results have a stable
documented sort order. Don't mix styles within one endpoint.

## Filtering and sorting

- Filters are snake_case query parameters named for the field: `?status=open&request_type=pothole`.
- Ranges: `created_after` / `created_before` (RFC 3339).
- Sorting, only if needed: `?sort=created_at` or `?sort=-created_at` (descending). Document the
  allowed fields as an enum.
- Never accept raw SQL, expression languages or field lists that reach the database unchecked.

## Headers

- `x-request-id` on every response. The starter takes API Gateway's request ID, falling back to a
  validated incoming `x-request-id` or a UUID. Include it in logs and in support requests.
- Security headers come from `helmet`. CORS is configured on API Gateway, not in the app (see
  [aws-terraform.md](aws-terraform.md)).
- Don't invent custom `X-` headers for things that belong in the body or a standard header.

## Health

`GET /v1/health` returns `200 {"status": "ok"}` with `security: []`. It's also the Lambda Web
Adapter readiness check. Keep it cheap: don't call the database on every health check unless the
developer wants a deep check, and then use a separate path such as `/v1/health/deep`.
