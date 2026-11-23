// Express application. Kept separate from server.ts so tests can run it without a network port.
import express, { type Express } from "express";
import * as OpenApiValidator from "express-openapi-validator";
import helmet from "helmet";
import { fileURLToPath } from "node:url";
import type { Logger } from "pino";
import { createMemoryStore, type ServiceRequestStore } from "./data/service-requests.js";
import { httpLogger } from "./logger.js";
import { problemHandler } from "./problem.js";
import { serviceRequestsRouter } from "./routes/service-requests.js";

/** openapi.yaml sits at the project root, next to src/ and dist/. */
export const SPEC_PATH = fileURLToPath(new URL("../openapi.yaml", import.meta.url));

export interface AppOptions {
  logger: Logger;
  store?: ServiceRequestStore;
  /** Validate responses against the spec. On in tests (contract tests); off in production. */
  validateResponses?: boolean;
}

export function createApp({ logger, store = createMemoryStore(), validateResponses = false }: AppOptions): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(httpLogger(logger));
  app.use(express.json({ limit: "100kb" }));

  app.use(
    OpenApiValidator.middleware({
      apiSpec: SPEC_PATH,
      validateRequests: { allowUnknownQueryParameters: false },
      validateResponses,
      // IAM (SigV4) is enforced by API Gateway before requests reach the app.
      validateSecurity: false,
    }),
  );

  app.get("/v1/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use(serviceRequestsRouter(store));

  app.use(problemHandler);
  return app;
}
