// Contract tests: real HTTP requests against the app with response validation turned on, so any
// response that doesn't match openapi.yaml fails the test with a 500.
import { pino } from "pino";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp({ logger: pino({ level: "silent" }), validateResponses: true });
const PROBLEM = /application\/problem\+json/;

describe("GET /v1/health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/v1/health").expect(200);
    expect(res.body).toEqual({ status: "ok" });
    expect(res.headers["x-request-id"]).toBeTruthy();
  });
});

describe("GET /v1/service-requests", () => {
  it("returns a page that matches the spec", async () => {
    const res = await request(app).get("/v1/service-requests?limit=10").expect(200);
    expect(res.body.data).toHaveLength(10);
    expect(typeof res.body.next_cursor).toBe("string");
  });

  it("follows next_cursor to the end", async () => {
    const seen = new Set<string>();
    let cursor: string | null = null;
    do {
      const query: Record<string, string> = { limit: "25", ...(cursor ? { cursor } : {}) };
      const res = await request(app).get("/v1/service-requests").query(query).expect(200);
      for (const item of res.body.data) seen.add(item.service_request_id);
      cursor = res.body.next_cursor;
    } while (cursor);
    expect(seen.size).toBe(60);
  });

  it.each([
    ["limit out of range", "?limit=0"],
    ["limit not a number", "?limit=abc"],
    ["unknown query parameter", "?colour=red"],
    ["invalid cursor", "?cursor=bad"],
  ])("rejects %s with a 400 problem", async (_name, qs) => {
    const res = await request(app).get(`/v1/service-requests${qs}`).expect(400);
    expect(res.headers["content-type"]).toMatch(PROBLEM);
    expect(res.body).toMatchObject({ status: 400, title: "Bad Request", type: "about:blank" });
  });
});

describe("GET /v1/service-requests/{service_request_id}", () => {
  it("returns one item", async () => {
    const res = await request(app).get("/v1/service-requests/sr-000001").expect(200);
    expect(res.body.service_request_id).toBe("sr-000001");
  });

  it("returns a 404 problem for an unknown id", async () => {
    const res = await request(app).get("/v1/service-requests/sr-999999").expect(404);
    expect(res.headers["content-type"]).toMatch(PROBLEM);
    expect(res.body.status).toBe(404);
  });

  it("returns a 400 problem for a malformed id", async () => {
    await request(app).get("/v1/service-requests/not-an-id").expect(400);
  });
});

describe("undocumented routes", () => {
  it("return a 404 problem", async () => {
    const res = await request(app).get("/v1/nope").expect(404);
    expect(res.headers["content-type"]).toMatch(PROBLEM);
  });

  it("never leak internals", async () => {
    const res = await request(app).get("/v1/nope");
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.(ts|js):\d+/);
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
