# Plan: `api-development` skill

**Goal:** a skill that helps coding agents create and maintain City of Asheville HTTP APIs the
City's way: spec-first OpenAPI, TypeScript + Express on AWS Lambda behind API Gateway, deployed
with Terraform.
**Status:** draft for review (2026-11-23). Decisions come from a Q&A with the dev team. There is no
separate spike: the skill is validated when the first real API is built in another repo, and revised
from what that build finds.
**Release impact:** new skill → **minor** bump (next release `v0.2.0`).

## Decisions

| Area | Decision |
|---|---|
| Language / framework | TypeScript on Node.js, **Express** |
| Runtime | Latest Node LTS that Lambda supports at build time. The skill tells agents to check AWS's runtime list, not hard-code a version. *(Built: `nodejs26.x`; TypeScript 5.9, because `openapi-typescript` doesn't support TypeScript 7 yet.)* |
| Design workflow | **Spec-first.** The OpenAPI file is the contract, reviewed in PRs before code. |
| OpenAPI version | **3.0.x.** API Gateway HTTP APIs import 3.0 natively. |
| Contract enforcement | **Both:** `openapi-typescript` generates handler types, and `express-openapi-validator` validates requests at runtime (responses in tests). |
| Compute | **AWS Lambda**, with the unchanged Express server run through **AWS Lambda Web Adapter**. The same code runs locally (`node`) and on Lambda. |
| Gateway | **API Gateway HTTP API (v2).** |
| Spec → gateway | **Import the spec into the gateway.** Terraform feeds the OpenAPI document (plus AWS integration extensions) as the API body. |
| IaC | **Terraform / OpenTofu, using modules wherever possible**: the infrastructure-as-code (IaC) team's modules first, then well-maintained registry modules, raw resources only when no module fits. |
| Terraform state | **S3 backend** with **S3 native locking** (`use_lockfile = true`, no DynamoDB table; needs Terraform/OpenTofu ≥ 1.10). Key `terraform/<project-name>/<environment>/terraform.tfstate`, environments **`dev`** and **`prod`**. The bucket name is **not** in the skill (public repo). The agent asks the developer or the IaC team for it. |
| AWS region | **`us-east-1`** by default (provider and backend), overridable per project. |
| Internal auth | **AWS IAM (SigV4) only.** The HTTP API's IAM authorization, with callers granted `execute-api:Invoke` on specific routes. Cognito/JWT is out of scope for now. |
| Public auth | **Anonymous + throttling.** |
| Errors | **RFC 9457 Problem Details** (`application/problem+json`). |
| Versioning | **URL major version** (`/v1/...`). Additive changes stay in v1; breaking changes mean `/v2`. |
| Naming | **kebab-case paths, snake_case JSON** fields and query params. |
| Pagination | **Cursor by default; offset allowed** for small or relational datasets. One documented shape for each. |
| Spec lint | **Spectral built-in OAS ruleset** only, for now. |
| Data stores | PostgreSQL/RDS (incl. PostGIS), DynamoDB, and wrapping existing City systems. |
| Tests required before merge | **Vitest** unit tests, **contract tests** against the spec, **breaking-change check** (`oasdiff`) vs. the base branch. |
| Docs | Rendered from the spec **locally only** (e.g. Redoc). No publishing yet. |
| Observability | **Structured JSON logs** (request ID, no PII) and a **health endpoint**. |
| Security | OWASP API Top 10 checklist, PII and public-records rules, CORS and security headers, secrets only in AWS Secrets Manager / SSM. |
| Deprecation | **Case by case.** The skill asks the developer for the policy and notice period, then records it in the spec and changelog. |
| Repo layout | **Mixed.** The starter must work as a standalone repo *or* as a subfolder of a monorepo or app repo. |
| Packaging | **One skill + references.** Short `SKILL.md`, detail in `references/`, plus a **starter template** in `assets/`. |
| Tasks covered | Start a new API · add or change endpoints · review an API/spec · version and deprecate · **adopt an existing API** (code-first or other stacks), with a migration path toward spec-first. |
| Generated types | **Committed.** CI fails if they don't match the spec (same pattern as this repo's catalog check). |
| Public abuse protection | **Route-level throttling by default.** The skill explains the shared-limit caveat and asks whether to add CloudFront + WAF. |
| AWS extensions | **Injected by Terraform.** The committed `openapi.yaml` stays vendor-neutral. |

## Trade-offs

Confirmed:

1. **HTTP API has no per-client rate limiting and no direct AWS WAF.** Throttling is per stage and
   per route, shared by all callers, so one heavy anonymous user can use up a public API's limit.
   **Decision:** route-level throttling by default. The skill explains this and asks whether the
   API needs CloudFront + WAF in front.
2. **HTTP APIs don't validate requests at the gateway.** Express validates requests from the same
   spec instead. The gateway still rejects unknown routes, because routes come from the imported
   spec.
3. **AWS extensions stay out of the contract.** **Decision:** the committed `openapi.yaml` stays
   clean. Terraform adds `x-amazon-apigateway-integration` and authorizers when it builds the
   gateway.

Accepted for now, with a follow-up:

4. **Spectral defaults won't enforce City conventions** (snake_case, kebab paths, Problem Details,
   `/v1`). The agent checks these by hand in reviews. A small City Spectral ruleset is a follow-up.

To verify on the first real build (no separate spike):

5. **The starter template's dependency versions will age.** The template pins exact versions known
   to work together. The skill tells agents to check for newer versions when scaffolding, and this
   repo's CI builds and tests the template so drift is caught (see Testing).
6. **Express 5 compatibility** of `express-openapi-validator`, and the Lambda Web Adapter setup
   details, the HTTP API spec import with Terraform-injected integrations, and whether the chosen
   Terraform modules accept an OpenAPI body. The starter is built from the docs and checked locally
   (types, lint, tests, `terraform validate`). The first real API confirms it deploys and runs, and
   the skill is revised from what it finds.

## Skill layout

```
skills/api-development/
├── SKILL.md                    # City defaults + task workflows (aim < 250 lines)
├── references/
│   ├── conventions.md          # naming, versioning, pagination, errors, health, headers
│   ├── openapi.md              # spec structure, 3.0 rules, components, examples, Spectral, oasdiff
│   ├── express-lambda.md       # app structure, validator + generated types, Lambda Web Adapter
│   ├── aws-terraform.md        # modules-first, S3 state convention, HTTP API from spec, IAM auth, throttling, CloudFront/WAF option
│   ├── data-access.md          # Postgres/PostGIS, DynamoDB, wrapping existing systems; cursor vs offset
│   ├── testing.md              # Vitest unit, contract tests, oasdiff in CI
│   ├── security-privacy.md     # OWASP API Top 10 checklist, PII, public records, CORS, secrets
│   ├── versioning-deprecation.md  # breaking-change rules, /v2 process, deprecation questions to ask
│   ├── adopting-existing-apis.md  # working in code-first/other-stack APIs; extracting a spec; migration steps
│   └── review-checklist.md     # used for "review an API/spec"
└── assets/
    └── starter/                # minimal working API (see below)
```

`metadata.compatibility: claude-code, gemini-cli, antigravity, github-copilot`. Add it only after
each tool has been tested by hand.

## `SKILL.md` outline

- **Description (trigger):** "Builds and maintains City of Asheville HTTP APIs: spec-first OpenAPI
  3.0, TypeScript + Express on AWS Lambda and API Gateway, Terraform. Use when creating a new API,
  adding or changing endpoints, editing an OpenAPI spec, reviewing an API or spec, or versioning and
  deprecating an API."
- **City defaults:** the decisions table above, condensed to one line each.
- **Always:** spec first; never put secrets or resident PII in specs, examples, logs or tests;
  disclose AI use in PRs; outputs may be public records.
- **Workflow: start a new API.** Ask the questions below, copy `assets/starter/` (standalone or into a
  subfolder), rename, write the first spec paths, generate types, implement, test, wire Terraform,
  run the checks.
- **Workflow: add or change an endpoint.** Edit the spec → `spectral lint` → `oasdiff` breaking
  check → regenerate types → implement → unit and contract tests → update the changelog.
- **Workflow: review.** Walk through `references/review-checklist.md` and report findings by severity.
- **Workflow: adopt an existing API.** Work within its current stack and conventions. Suggest
  generating and committing a spec from the running API as step one, then add spec lint,
  `oasdiff` and contract tests. Treat that spec as the contract going forward. Don't rewrite
  stacks unless asked.
- **Workflow: version and deprecate.** Classify the change. If it's breaking, plan `/v2` and run v1
  alongside it. Ask for deprecation policy and notice. Mark `deprecated: true` and record dates.
- **Questions the agent must ask** before scaffolding (never assume):
  - internal-only or public?
  - for internal APIs, which IAM roles or services may call it?
  - data source?
  - standalone or subfolder?
  - throttling limits?
  - for public APIs, is CloudFront/WAF needed? (explain the shared-throttle caveat)
  - project name (used in the state key) and the Terraform state bucket name? Never commit guesses;
    leave a clear placeholder if unknown.
  - which IaC-team Terraform modules exist for Lambda, API Gateway and logging?

## Starter template (`assets/starter/`)

Minimal but working. Every file is something a real API needs.

- `openapi.yaml`: `/v1/health`, one example resource with a cursor-paginated list, Problem Details
  error schema, snake_case fields, servers placeholder.
- `src/app.ts`: Express app, `express-openapi-validator`, JSON logger with request ID, Problem
  Details error handler, security headers. *(Built: CORS moved to the API Gateway
  `cors_configuration`, because preflight `OPTIONS` requests never reach the app when routes are
  imported from the spec.)*
- `src/server.ts`: `listen()` entry used both locally and by Lambda Web Adapter.
- `src/generated/`: committed output of `openapi-typescript`. A `gen:types:check` script (run in CI)
  fails when it doesn't match the spec.
- `test/`: Vitest unit test, and a contract test (supertest + response validation against the spec).
- `infra/`: Terraform built from modules where possible. It covers the HTTP API (spec body plus
  injected integrations), the Lambda function with the Web Adapter layer, log group, execution
  role, IAM authorization on routes, and route throttling.
  - `infra/backend/dev.s3.tfbackend` and `prod.s3.tfbackend`: `bucket = "<STATE_BUCKET>"`
    (placeholder), `key = "terraform/<project-name>/dev/terraform.tfstate"` (and `prod`),
    `region = "us-east-1"`, `use_lockfile = true`. Used with
    `terraform init -backend-config=backend/dev.s3.tfbackend`.
  - `required_version = ">= 1.10"` and the AWS provider `region` default `us-east-1`.
  - `infra/env/dev.tfvars` and `prod.tfvars`: per-environment settings (throttle limits, log
    retention, allowed caller roles).
- `.spectral.yaml`, `package.json` scripts (`lint:spec`, `gen:types`, `test`, `docs` for local Redoc,
  `breaking`), `.github/workflows/api-ci.yml`, `README.md`.
- No real City hostnames, account IDs, ARNs or data. Placeholders only, because this repo is public.

## Testing the skill (this repo)

- `npm run lint`, the catalog and the smoke install cover the skill's structure. The starter ships
  as files, so the smoke test checks it is copied byte-for-byte.
- **New CI job (proposed):** install the starter's dependencies, then run its spec lint, type
  generation, `tsc`, Vitest and `terraform validate` (no deploy). This catches template rot.
- **Manual:** in each harness, ask for (1) a new API, (2) a new endpoint on it, (3) a review of a
  deliberately flawed spec, (4) a breaking change. Record results in the PR.

## Phases

1. **Starter template** in `assets/starter/` plus the new CI job. Checked locally and in CI: spec
   lint, type generation, `tsc`, Vitest, `terraform validate`. Not deployed.
2. **`SKILL.md` + references,** written against the starter.
3. **Manual harness tests,** then PR → review → release `v0.2.0`.
4. **First real API (in another repo)** serves as the end-to-end test: deploy to `dev`, confirm the
   Lambda Web Adapter, spec import, IAM auth and throttling work, then revise the skill (patch or
   minor release) from what it finds.
5. **Follow-ups:** City Spectral ruleset, docs publishing, metrics and alarms, tracing, Cognito/JWT
   auth if needed later.

## Open questions

None. All design questions are answered. Anything else comes out of building the first real API.

---
_Drafted with AI assistance (Claude Code) from the dev team's answers. Verify the technical claims,
especially AWS service limits and module capabilities, when building the first real API._
