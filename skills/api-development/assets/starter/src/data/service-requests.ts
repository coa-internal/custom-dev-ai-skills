// Data access for the example resource. Routes depend on the ServiceRequestStore interface, so the
// in-memory store can be replaced with PostgreSQL, DynamoDB or a wrapper around an existing City
// system without touching the routes. Sample data is synthetic: never use real resident data.
import type { components } from "../generated/openapi.js";

export type ServiceRequest = components["schemas"]["ServiceRequest"];

export interface ListResult {
  items: ServiceRequest[];
  /** Sort key of the last returned item when more items exist. */
  nextAfter?: string;
}

export interface ServiceRequestStore {
  /** Newest first. `after` is the id of the last item on the previous page. */
  list(options: { limit: number; after?: string }): Promise<ListResult>;
  get(id: string): Promise<ServiceRequest | undefined>;
}

const TYPES = ["pothole", "streetlight", "graffiti", "missed_collection"] as const;
const STATUSES = ["open", "in_progress", "closed"] as const;

export function sampleServiceRequests(count = 60): ServiceRequest[] {
  const base = Date.UTC(2026, 0, 1);
  return Array.from({ length: count }, (_, i) => {
    const created = new Date(base + i * 3_600_000).toISOString();
    return {
      service_request_id: `sr-${String(i + 1).padStart(6, "0")}`,
      request_type: TYPES[i % TYPES.length]!,
      status: STATUSES[i % STATUSES.length]!,
      created_at: created,
      updated_at: created,
    };
  }).reverse();
}

export function createMemoryStore(items: ServiceRequest[] = sampleServiceRequests()): ServiceRequestStore {
  // ids are zero-padded, so string order matches creation order; newest first.
  const sorted = [...items].sort((a, b) => b.service_request_id.localeCompare(a.service_request_id));
  return {
    async list({ limit, after }) {
      const start = after === undefined ? 0 : sorted.findIndex((x) => x.service_request_id < after);
      const page = start < 0 ? [] : sorted.slice(start, start + limit);
      const more = start >= 0 && start + limit < sorted.length;
      return { items: page, ...(more ? { nextAfter: page.at(-1)!.service_request_id } : {}) };
    },
    async get(id) {
      return sorted.find((x) => x.service_request_id === id);
    },
  };
}
