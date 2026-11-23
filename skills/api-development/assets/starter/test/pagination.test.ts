// Unit tests: pagination helpers and the in-memory store, with no HTTP involved.
import { describe, expect, it } from "vitest";
import { createMemoryStore, sampleServiceRequests } from "../src/data/service-requests.js";
import { decodeCursor, encodeCursor } from "../src/pagination.js";
import { HttpProblem } from "../src/problem.js";

describe("cursor encoding", () => {
  it("round-trips", () => {
    expect(decodeCursor(encodeCursor({ after: "sr-000010" }))).toEqual({ after: "sr-000010" });
  });

  it("returns undefined when no cursor is given", () => {
    expect(decodeCursor(undefined)).toBeUndefined();
  });

  it("rejects tampered cursors with a 400 problem", () => {
    expect(() => decodeCursor("not-a-cursor")).toThrow(HttpProblem);
    try {
      decodeCursor(Buffer.from('{"before":1}').toString("base64url"));
    } catch (e) {
      expect((e as HttpProblem).status).toBe(400);
    }
  });
});

describe("memory store", () => {
  const store = createMemoryStore(sampleServiceRequests(5));

  it("pages newest first without gaps or repeats", async () => {
    const first = await store.list({ limit: 2 });
    expect(first.items.map((x) => x.service_request_id)).toEqual(["sr-000005", "sr-000004"]);
    const second = await store.list({ limit: 2, after: first.nextAfter! });
    expect(second.items.map((x) => x.service_request_id)).toEqual(["sr-000003", "sr-000002"]);
    const last = await store.list({ limit: 2, after: second.nextAfter! });
    expect(last.items.map((x) => x.service_request_id)).toEqual(["sr-000001"]);
    expect(last.nextAfter).toBeUndefined();
  });

  it("finds items by id", async () => {
    expect((await store.get("sr-000003"))?.request_type).toBeDefined();
    expect(await store.get("sr-999999")).toBeUndefined();
  });
});
