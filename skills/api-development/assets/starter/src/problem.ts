// RFC 9457 Problem Details helpers. Every error response uses application/problem+json.
import type { ErrorRequestHandler, Request, Response } from "express";
import { STATUS_CODES } from "node:http";
import type { components } from "./generated/openapi.js";

export type Problem = components["schemas"]["Problem"];
type ProblemErrors = NonNullable<Problem["errors"]>;

/** An error that maps directly to a Problem Details response. */
export class HttpProblem extends Error {
  constructor(
    readonly status: number,
    readonly detail?: string,
    readonly errors?: ProblemErrors,
  ) {
    super(detail ?? STATUS_CODES[status] ?? "Error");
  }
}

export function sendProblem(req: Request, res: Response, status: number, detail?: string, errors?: ProblemErrors): void {
  const body: Problem = {
    type: "about:blank",
    title: STATUS_CODES[status] ?? "Error",
    status,
    instance: req.path,
    ...(detail ? { detail } : {}),
    ...(errors?.length ? { errors } : {}),
  };
  res.status(status).type("application/problem+json").json(body);
}

interface ValidatorError {
  status?: number;
  message?: string;
  errors?: Array<{ path?: string; message?: string }>;
}

/**
 * Final error handler. Known 4xx errors (from the OpenAPI validator or HttpProblem) are returned
 * with their detail. Anything else is logged and returned as a generic 500, never with a stack
 * trace or internal message.
 */
export const problemHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  if (err instanceof HttpProblem) {
    sendProblem(req, res, err.status, err.detail, err.errors);
    return;
  }
  const e = err as ValidatorError;
  const status = typeof e?.status === "number" && e.status >= 400 && e.status < 500 ? e.status : 500;
  if (status === 500) {
    req.log?.error({ err }, "unhandled error");
    sendProblem(req, res, 500, "An unexpected error occurred.");
    return;
  }
  const errors = (e.errors ?? []).map((x) => ({ path: x.path, message: x.message ?? "Invalid value" }));
  sendProblem(req, res, status, e.message, errors);
};
