# Versioning and deprecation

APIs carry a **major version in the URL** (`/v1`). Within a major version, changes must be
backward compatible. Breaking changes go in a new major version that runs alongside the old one.

## Breaking or not?

| Breaking (needs `/v2`) | Not breaking (OK in `/v1`) |
|---|---|
| Removing or renaming an operation, path, field or parameter | Adding an operation or path |
| Changing a field's type, format or meaning | Adding an optional request field or query parameter |
| Making an optional request field or parameter required | Adding a response field (clients must ignore unknown fields) |
| Removing an enum value, or (for strict clients) adding one | Relaxing validation (longer `maxLength`, higher `maximum`) |
| Tightening validation (shorter `maxLength`, new `pattern`) | Adding a new error response for a new situation |
| Changing status codes, the error shape or pagination style | Fixing behavior to match the documented spec* |
| Changing auth (public → IAM) or the default sort order | Performance improvements with identical output |

\*If clients depend on the buggy behavior, treat it as breaking and discuss it with the developer.

`oasdiff` (CI and `npm run breaking`) catches most spec-level breaks. Behavior changes that don't
show in the spec (sort order, meaning of a field) are your responsibility to flag.

Also bump `info.version` in the spec (semver) with each change: major for a new URL version, minor
for additions, patch for fixes and docs.

## Introducing `/v2`

1. Confirm with the developer that the change can't be made additively.
2. Add the `/v2/...` paths to the **same** `openapi.yaml`, with separate `operationId`s
   (`listServiceRequestsV2`) and, where shapes differ, separate schemas (`ServiceRequestV2`). Shared
   schemas stay shared.
3. Implement `/v2` routes alongside `/v1`. Both run in the same Lambda unless the developer wants to
   split them.
4. Contract-test both versions.
5. Deprecate `/v1` (below) once `/v2` is live. Don't remove it in the same release.

## Deprecation

There is **no City-wide deprecation policy or minimum notice period**. Each API's owner decides.
Before deprecating anything, **ask the developer**:

- Who uses this operation or version (callers' IAM roles, known public consumers)?
- How much notice do they get, and what is the removal date?
- How will consumers be told (email list, changelog, release notes)?
- Should responses carry `Deprecation` and `Sunset` headers (RFC 9745 / RFC 8594)? This is
  optional and per API.

Then:

1. Mark the operation `deprecated: true` in the spec and add to its `description`:
   `Deprecated YYYY-MM-DD. Use GET /v2/service-requests. Planned removal YYYY-MM-DD.`
2. Record the deprecation in the API's changelog or release notes.
3. If the developer chose headers, add a small middleware that sets them for the deprecated routes,
   and document the headers in the spec.
4. Watch usage (logs or metrics by route) before removal, and remove only on or after the announced
   date, with the developer's go-ahead.
5. Removal is a spec change: delete the paths, regenerate types, remove the routes and tests.
   `oasdiff` will flag it as breaking, which is expected for a planned removal; note this in the PR.
