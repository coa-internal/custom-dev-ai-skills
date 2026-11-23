# Express on Lambda

The starter runs an ordinary Express 5 server. Locally it listens on port 8080. On Lambda, the AWS
Lambda Web Adapter starts the same server through `run.sh` and forwards API Gateway requests to it.
There is no Lambda-specific handler code.

## Layout

| File | Responsibility |
|---|---|
| `src/server.ts` | Entry point: load config, create logger and app, `listen()` |
| `src/app.ts` | `createApp()`: helmet, logging, JSON body limit, OpenAPI validator, routes, error handler |
| `src/routes/*.ts` | One router per resource. Handlers stay thin: parse, call the data layer, shape the response |
| `src/data/*.ts` | Data access behind an interface ([data-access.md](data-access.md)) |
| `src/problem.ts` | `HttpProblem`, `sendProblem`, `problemHandler` (RFC 9457) |
| `src/pagination.ts` | Opaque cursor encode/decode |
| `src/config.ts` | Environment configuration |
| `src/generated/openapi.ts` | Generated types; don't edit |

Keep `createApp()` free of side effects (no `listen()`, no network calls) so tests can build it
with fakes.

## Adding a route

After the spec change and `npm run gen:types`:

```ts
import type { operations } from "../generated/openapi.js";

type CreateBody = operations["createServiceRequest"]["requestBody"]["content"]["application/json"];
type Created = operations["createServiceRequest"]["responses"]["201"]["content"]["application/json"];

router.post("/v1/service-requests", async (req, res) => {
  const body = req.body as CreateBody;           // already validated against the spec
  const created: Created = await store.create(body);
  res.status(201).location(`/v1/service-requests/${created.service_request_id}`).json(created);
});
```

- **Express route paths use `:param`**, the spec uses `{param}`. Keep names identical
  (`:service_request_id`).
- Express 5 forwards rejected promises to the error handler, so `async` handlers don't need
  try/catch just to call `next(err)`.
- Throw `new HttpProblem(404, "No service request with that identifier.")` for expected errors.
  Unexpected errors become a generic 500, and the details go to the logs only.
- Annotate response objects with the generated types so TypeScript catches drift. Contract tests
  catch the rest.

## Validation (`express-openapi-validator`)

Configured in `src/app.ts`:

- `validateRequests` with `allowUnknownQueryParameters: false`. Unknown query parameters are a 400,
  so typos don't silently do nothing.
- `validateResponses` is **off in production, on in tests**. Contract tests turn it on so any
  response that drifts from the spec fails.
- `validateSecurity: false`. API Gateway enforces IAM before the request reaches Lambda.
- The validator coerces query and path values to the spec's types (`limit` becomes a number).
- Requests to paths not in the spec get a 404 problem. Add the path to the spec first.

## Logging

- Use `req.log` (pino-http) inside handlers. Every line includes the request ID.
- Log events and IDs, not payloads: `req.log.info({ service_request_id }, "created")`.
- **Never log** request or response bodies, query strings, Authorization or cookie headers,
  resident PII, secrets or full upstream errors. The starter already redacts credential headers and
  logs paths without query strings.
- Levels: `error` for failures needing attention, `warn` for handled anomalies, `info` for request
  summaries and key events, `debug` for local troubleshooting (dev only).

## Configuration and secrets

- Non-secret configuration comes from environment variables set by Terraform (`LOG_LEVEL`,
  table names, feature flags) and read in `src/config.ts`.
- **Secrets** (database passwords, upstream API keys) live in AWS Secrets Manager or SSM Parameter
  Store (SecureString). Read them at startup with the AWS SDK v3, cache them in memory, and grant the
  Lambda role read access to those specific ARNs only. Environment variables hold the secret's
  *name or ARN*, never its value.
- Don't commit `.env` files. Use `.env.example` with placeholder values if local setup needs one.

## Lambda Web Adapter

Set by Terraform:

| Setting | Value |
|---|---|
| Handler | `run.sh` (runs `node dist/server.js`) |
| Layer | `arn:aws:lambda:<region>:753240598075:layer:LambdaAdapterLayer{Arm64\|X86}:<version>`. Check the current version in the project's docs |
| `AWS_LAMBDA_EXEC_WRAPPER` | `/opt/bootstrap` |
| `AWS_LWA_PORT` | `8080` (matches `PORT` default in `src/config.ts`) |
| `AWS_LWA_READINESS_CHECK_PATH` | `/v1/health` |

Notes:

- **Timeouts:** HTTP APIs stop waiting after 30 seconds. The starter sets the Lambda timeout to 29.
  Long work belongs in a queue (respond 202).
- **Cold starts:** keep startup work small. Prefer arm64. Lazy-load rarely used SDK clients.
- **Body limit:** `express.json({ limit: "100kb" })`. Raise it deliberately. Lambda caps synchronous
  request and response payloads at 6 MB, so use S3 presigned URLs for files.
- **Statelessness:** no in-memory sessions or caches that must be consistent across instances.
- **Packaging:** `npm run package` builds `lambda.zip` with `dist/`, `openapi.yaml` (the validator
  reads it at runtime), `run.sh` and production dependencies. Native modules must be built for the
  Lambda architecture (arm64 by default).
