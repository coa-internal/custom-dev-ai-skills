// Structured JSON logging with a request ID on every line. Never log resident PII, credentials,
// tokens or full request bodies.
import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { pino, type Logger } from "pino";
import { pinoHttp } from "pino-http";

export function createLogger(level: string): Logger {
  return pino({
    level,
    // pid/hostname add nothing on Lambda; CloudWatch already records the function and stream.
    base: undefined,
    // Signed requests carry credentials in these headers.
    redact: ["req.headers.authorization", "req.headers.cookie", 'req.headers["x-amz-security-token"]'],
  });
}

/** Prefer API Gateway's request ID (forwarded by the Lambda Web Adapter), then a caller-supplied one. */
function requestId(req: IncomingMessage): string {
  const context = req.headers["x-amzn-request-context"];
  if (typeof context === "string") {
    try {
      const id = (JSON.parse(context) as { requestId?: unknown }).requestId;
      if (typeof id === "string" && id) return id;
    } catch {
      // fall through
    }
  }
  const supplied = req.headers["x-request-id"];
  if (typeof supplied === "string" && /^[\w-]{1,128}$/.test(supplied)) return supplied;
  return randomUUID();
}

export function httpLogger(logger: Logger) {
  return pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = requestId(req);
      res.setHeader("x-request-id", id);
      return id;
    },
    // Log the path without the query string, which may contain user input.
    serializers: {
      req: (req: { id: unknown; method: string; url: string }) => ({
        id: req.id,
        method: req.method,
        path: req.url.split("?")[0],
      }),
      res: (res: { statusCode: number }) => ({ status_code: res.statusCode }),
    },
  });
}
