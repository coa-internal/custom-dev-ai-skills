# City API starter

A minimal, working City of Asheville HTTP API. Copy it, rename it, and replace the example
`service-requests` resource with your own.

- **Contract:** `openapi.yaml` (OpenAPI 3.0) is the source of truth. Change it first, in its own
  reviewable diff.
- **App:** TypeScript + Express. Requests are validated against the spec at runtime, and handler
  types are generated from it (`src/generated/`, committed).
- **Runtime:** AWS Lambda running the unchanged Express server through the AWS Lambda Web Adapter,
  behind an API Gateway HTTP API built from the spec.
- **Infra:** Terraform in `infra/`, S3 state with native locking, `dev` and `prod` environments.

## Requirements

Node.js 26 (see `.nvmrc`; 24+ works locally), Terraform ≥ 1.10, `zip`, and optionally
[oasdiff](https://github.com/oasdiff/oasdiff) for local breaking-change checks.

## Everyday commands

```bash
npm ci
npm run dev              # local server on http://localhost:8080 (reloads on change)
npm run check            # spec lint + generated types up to date + typecheck + tests (same as CI)
npm run gen:types        # after editing openapi.yaml
npm run breaking         # compare openapi.yaml with origin/main (needs oasdiff)
npm run docs             # render API docs to .docs/index.html (local only)
npm run package          # build lambda.zip for deployment
```

## Changing the API (spec-first)

1. Edit `openapi.yaml`. Paths are kebab-case under `/v1`, and JSON fields and query parameters are
   snake_case. Errors use the `Problem` responses.
2. `npm run lint:spec` and `npm run breaking`. A breaking change needs a new major version
   (`/v2`), not an edit to `/v1`.
3. `npm run gen:types`, then implement the handler using the generated types.
4. Add unit tests and contract tests (`test/contract.test.ts` validates every response against the
   spec), then `npm run check`.

## Auth

Operations require AWS IAM (SigV4) by default (top-level `security: [aws_iam]`). Mark a public
operation with `security: []`, as `/v1/health` does. Terraform turns this into API Gateway IAM
authorization, so the app itself never checks credentials. Callers attach the `invoke_policy_arn`
output (or a narrower policy) to their IAM role.

## Deploying

```bash
npm run package
cd infra
# First time: fill in backend/*.s3.tfbackend (state bucket from the infrastructure-as-code team)
# and env/*.tfvars (project name). Never commit real secrets.
terraform init -backend-config=backend/dev.s3.tfbackend
terraform plan  -var-file=env/dev.tfvars -out=dev.tfplan
terraform apply dev.tfplan
```

For `prod`, run `terraform init -reconfigure -backend-config=backend/prod.s3.tfbackend` and use
`env/prod.tfvars`. Prefer the infrastructure-as-code team's Terraform modules over the public
registry ones used here, if they exist.

**Throttling** is per route but shared by *all* callers. For public APIs, decide whether you also
need CloudFront + AWS WAF in front to stop one client from using up the limit.

## Layout

```text
openapi.yaml              API contract (vendor-neutral; Terraform adds AWS settings at deploy)
src/app.ts                Express app: helmet, JSON logs, OpenAPI validation, routes, errors
src/server.ts             Entry point (local and Lambda)
src/problem.ts            RFC 9457 Problem Details errors
src/pagination.ts         Opaque cursor pagination
src/data/                 Data access behind an interface (swap in Postgres, DynamoDB, etc.)
src/routes/               Route handlers
src/generated/openapi.ts  Generated from openapi.yaml; do not edit
test/                     Vitest unit and contract tests
run.sh                    Lambda Web Adapter start script
infra/                    Terraform (backend/ and env/ per environment)
.github/workflows/        CI (move to the repo root if this API is in a subfolder)
```

## Public records and privacy

API code, specs, logs and data may be public records under N.C.G.S. §132. Keep resident personal
data out of specs, examples, test data and logs. Secrets belong in AWS Secrets Manager or SSM
Parameter Store, never in code, specs, Terraform variables or `.tfvars` files.
