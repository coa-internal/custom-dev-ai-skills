// Opaque cursor pagination. Cursors are base64url-encoded JSON so their contents can change
// without breaking clients; clients must treat them as opaque strings.
import { HttpProblem } from "./problem.js";

export interface CursorState {
  /** Sort key of the last item on the previous page. */
  after: string;
}

export function encodeCursor(state: CursorState): string {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | undefined): CursorState | undefined {
  if (cursor === undefined) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (parsed && typeof parsed === "object" && typeof (parsed as CursorState).after === "string") {
      return { after: (parsed as CursorState).after };
    }
  } catch {
    // fall through
  }
  throw new HttpProblem(400, "The cursor parameter is not valid. Use next_cursor from a previous response.");
}
