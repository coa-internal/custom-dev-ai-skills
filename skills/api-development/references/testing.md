# Testing

Required before merge: **unit tests**, **contract tests** and the **breaking-change check**. All of
it runs in CI (`npm run check` plus the oasdiff step).

## Unit tests (Vitest)

`test/*.test.ts`, no network and no AWS. Cover the logic that isn't HTTP plumbing:

- data-layer mapping (rows → spec shapes), cursor encode/decode, filters and sort mapping;
- business rules and edge cases (empty results, last page, invalid state transitions);
- upstream error mapping for wrapped systems, using a fake client.

Build stores and clients through interfaces so tests pass fakes instead of mocking modules.

## Contract tests

`test/contract.test.ts` sends real HTTP requests to `createApp({ validateResponses: true })` with
supertest. Response validation is on, so **any response that doesn't match `openapi.yaml` fails as a
500**, which catches drift between the spec and the code.

For each operation, cover at least:

- the success response (and pagination across pages for lists);
- each documented error: 400 for each kind of invalid input, 404 for missing resources, 409 and
  others as applicable. Assert `content-type` is `application/problem+json` and `status` matches;
- that undocumented query parameters and routes are rejected.

Inject a fake or in-memory store with synthetic data:

```ts
const app = createApp({ logger: pino({ level: "silent" }), store: createMemoryStore(fixtures), validateResponses: true });
await request(app).get("/v1/service-requests?limit=2").expect(200);
```

## Generated types and spec lint

`npm run check` also runs `lint:spec` (Spectral) and `gen:types:check` (fails if
`src/generated/openapi.ts` is stale), then `tsc`. Fix failures at the source: the spec, then
regenerate.

## Breaking changes (oasdiff)

- Local: `npm run breaking` (compares with `origin/main`; needs `oasdiff`).
- CI: the starter's `api-ci.yml` extracts the base branch's `openapi.yaml` and runs the oasdiff
  action with `fail-on: ERR`.
- A failure means the change would break existing clients of this major version. Make it additive,
  or plan `/v2` ([versioning-deprecation.md](versioning-deprecation.md)). Don't silence the check.

## Integration tests (optional)

Not required by default. If the developer wants them, run them against local services (a
PostgreSQL container, DynamoDB Local) in a separate `npm run test:integration` script and CI job,
never against shared dev or prod data.

## Before handing back

Run `npm run check`, `npm run package` and `terraform -chdir=infra validate`, and report the
results honestly, including anything you couldn't run (for example `breaking` without oasdiff
installed).
