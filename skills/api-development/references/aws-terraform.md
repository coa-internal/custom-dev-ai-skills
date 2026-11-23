# AWS and Terraform

The starter's `infra/` deploys one Lambda function and one API Gateway HTTP API per environment.

## Modules first

1. Use the **infrastructure-as-code team's modules** when they exist for what you need. Ask the
   developer which ones exist (Lambda, API Gateway, logging, alarms).
2. Otherwise use well-maintained public registry modules. The starter uses
   `terraform-aws-modules/lambda/aws` and `terraform-aws-modules/apigateway-v2/aws`.
3. Use raw resources only for small pieces no module covers (the starter's `aws_lambda_permission`
   and invoke policy).

Pin module and provider versions with `~>` and upgrade deliberately. If you swap in a team module,
it must accept the generated OpenAPI `body` (see below) or an equivalent.

## State and environments

- S3 backend, **S3 native locking** (`use_lockfile = true`, Terraform/OpenTofu ≥ 1.10), no DynamoDB
  lock table.
- Key convention: `terraform/<project-name>/<environment>/terraform.tfstate`, environments `dev`
  and `prod`. Region `us-east-1` unless the developer says otherwise.
- `infra/backend/<env>.s3.tfbackend` holds the backend settings. **Ask for the state bucket name**
  (the infrastructure-as-code team owns it). If it's unknown, leave `<STATE_BUCKET>`. Never guess or
  copy a bucket name from another project.
- `infra/env/<env>.tfvars` holds per-environment settings. No secrets in tfvars.

```bash
terraform -chdir=infra init -backend-config=backend/dev.s3.tfbackend
terraform -chdir=infra plan -var-file=env/dev.tfvars -out=dev.tfplan
terraform -chdir=infra apply dev.tfplan          # developer runs this
# prod: init -reconfigure -backend-config=backend/prod.s3.tfbackend, env/prod.tfvars
```

Agents may run `init -backend=false`, `fmt` and `validate` freely. `plan` against real state needs
the developer's credentials. **Don't run `apply` unless explicitly asked**, and never against prod
without confirmation.

## Spec → API Gateway

`infra/main.tf` reads `../openapi.yaml` and builds the gateway definition. For every operation it:

- adds `x-amazon-apigateway-integration` (Lambda proxy, payload format 2.0);
- adds `x-amazon-apigateway-auth`: `AWS_IAM` if the operation's effective `security` includes
  `aws_iam`, otherwise `NONE`;
- removes `security` and `securitySchemes`, which API Gateway doesn't use.

The result is passed as the HTTP API `body`, so **gateway routes always match the spec**. Unknown
routes are rejected at the gateway. HTTP APIs don't validate request bodies or parameters; Express
does that from the same spec.

If the spec gains features API Gateway rejects on import, fix the spec, or strip that feature in the
`locals` transform with a comment explaining why. Don't add AWS extensions to `openapi.yaml`.

## Auth

- **IAM (default):** callers sign requests with SigV4 using an IAM role allowed to run
  `execute-api:Invoke`. Terraform outputs `invoke_policy_arn` (whole API) to attach to caller roles.
  For least privilege, write narrower policies per caller:
  `arn:aws:execute-api:<region>:<account>:<api-id>/<stage>/<METHOD>/<path>`, e.g.
  `.../$default/GET/v1/service-requests`. With the `$default` stage, `<stage>` is `$default`.
- IAM proves *which service* is calling, not which resident or record it may access. If records
  belong to specific people or departments, the app must also check object-level access
  ([security-privacy.md](security-privacy.md)).
- **Public operations:** `security: []` in the spec. Everything else stays IAM.
- Cognito/JWT and API keys are not City defaults. Don't add them unless the developer decides to.

## Throttling and abuse protection

- `throttling_rate_limit` / `throttling_burst_limit` apply to **each route**, but the limit is
  **shared by all callers**. One heavy client can use it up for everyone.
- HTTP APIs have no per-client usage plans and can't attach AWS WAF directly. For public APIs, ask
  whether to put **CloudFront + AWS WAF** in front (rate-based rules per IP, managed rule groups).
  It isn't in the starter; add it only when asked.
- Lambda reserved concurrency can cap cost and protect downstream databases. Ask before setting it.

## CORS

Browser callers need CORS, and it's configured on the **gateway** (`cors_allow_origins` variable),
because preflight `OPTIONS` requests are answered by API Gateway and never reach Express when routes
come from the spec.

- List exact origins (`https://app.example.gov`). Never use `*` for IAM-protected APIs.
- Leave it empty for service-to-service APIs.

## Lambda settings

- Runtime: newest Node.js LTS on the [Lambda runtimes list](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html).
  Update `lambda_runtime` and `.nvmrc` together.
- Architecture: arm64 (cheaper). The Web Adapter layer name must match (`LambdaAdapterLayerArm64`).
- Web Adapter layer version: check the [project releases](https://github.com/awslabs/aws-lambda-web-adapter)
  and update `lambda_web_adapter_layer_version`.
- Memory 512 MB, timeout 29 s by default. Tune from real metrics.
- Logs: the Lambda module creates the log group with `log_retention_days`. Confirm retention with
  the developer, because City records-retention rules may apply.
- Least privilege: add IAM statements to the Lambda role only for the specific tables, secrets or
  buckets it uses.

## Not in the starter (ask first)

Custom domain names and certificates, VPC access (needed for private RDS, adds cold-start and NAT
considerations), CloudFront/WAF, alarms and dashboards, tracing, multiple Lambda functions.
