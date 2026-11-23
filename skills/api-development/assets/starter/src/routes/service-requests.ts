// Handlers for the example resource. Request shapes are already validated against openapi.yaml by
// express-openapi-validator, and types come from src/generated/openapi.ts.
import { Router } from "express";
import type { ServiceRequestStore } from "../data/service-requests.js";
import type { operations } from "../generated/openapi.js";
import { decodeCursor, encodeCursor } from "../pagination.js";
import { HttpProblem } from "../problem.js";

type ListQuery = NonNullable<operations["listServiceRequests"]["parameters"]["query"]>;
type ListResponse = operations["listServiceRequests"]["responses"]["200"]["content"]["application/json"];

export function serviceRequestsRouter(store: ServiceRequestStore): Router {
  const router = Router();

  router.get("/v1/service-requests", async (req, res) => {
    const query = req.query as ListQuery;
    const cursor = decodeCursor(query.cursor);
    const result = await store.list({ limit: query.limit ?? 25, ...(cursor ? { after: cursor.after } : {}) });
    const body: ListResponse = {
      data: result.items,
      next_cursor: result.nextAfter ? encodeCursor({ after: result.nextAfter }) : null,
    };
    res.json(body);
  });

  router.get("/v1/service-requests/:service_request_id", async (req, res) => {
    const item = await store.get(req.params.service_request_id);
    if (!item) throw new HttpProblem(404, "No service request with that identifier.");
    res.json(item);
  });

  return router;
}
