# Data access

Routes depend on a small store interface (`src/data/*.ts`), never directly on a database client.
The starter ships an in-memory store with synthetic data. Replace it with one of the patterns below
and keep the interface, so tests can keep using fakes.

```ts
export interface ServiceRequestStore {
  list(options: { limit: number; after?: string }): Promise<{ items: ServiceRequest[]; nextAfter?: string }>;
  get(id: string): Promise<ServiceRequest | undefined>;
}
```

Map storage rows to the spec's shapes in the store: snake_case fields, string IDs, RFC 3339
timestamps. Don't leak column names or internal fields the spec doesn't list.

## PostgreSQL / RDS (and PostGIS)

- Driver: `pg` with a module-level `Pool` created once per Lambda instance. Keep `max` small (2–5).
  For many concurrent Lambdas, recommend **RDS Proxy**.
- **Parameterized queries only** (`$1, $2`). Never build SQL from strings, including sort fields.
  Map an allowed sort enum to fixed SQL fragments.
- Credentials from Secrets Manager (or RDS IAM authentication). Ask which the database uses.
- The Lambda needs VPC access to reach a private database. That changes the Terraform (subnets,
  security groups), so ask before adding it.
- Migrations: ask which tool the team uses. Keep migrations in the repo and run them outside the
  request path.

Cursor (keyset) pagination, newest first, with a unique tiebreaker:

```sql
SELECT id, request_type, status, created_at, updated_at
FROM service_requests
WHERE ($2::timestamptz IS NULL OR (created_at, id) < ($2, $3))
ORDER BY created_at DESC, id DESC
LIMIT $1 + 1;               -- fetch one extra to know whether there's a next page
```

Encode `{created_at, id}` of the last row as the cursor. Offset pagination
(`LIMIT $1 OFFSET $2`, plus `count(*)` for `total_count`) is fine for small tables only.

**PostGIS:** return geometry as GeoJSON in WGS 84 (`ST_AsGeoJSON(ST_Transform(geom, 4326))`). Accept
bounding boxes as `bbox=min_lon,min_lat,max_lon,max_lat` and validate the ranges. Cap result
sizes; spatial queries can be expensive.

## DynamoDB

- AWS SDK v3 `DynamoDBDocumentClient`, created once per instance.
- Design keys for the API's access patterns. **Don't `Scan`** for list endpoints; `Query` a
  partition or a GSI.
- Cursor pagination maps to `LastEvaluatedKey`: serialize it into the opaque cursor and pass it back
  as `ExclusiveStartKey`. Validate the decoded key's shape before using it, because a client can
  tamper with the cursor.
- `Limit` caps items *evaluated*, so a filtered page can return fewer items than `limit`. Document
  that pages may be short, or loop until full.
- Grant the Lambda role only the actions it needs on the specific table and index ARNs.
- Pass table names through environment variables set by Terraform.

## Wrapping existing City systems

When the API fronts an existing system (a vendor product, an internal service, a GIS server):

- Put a client module behind the store interface. Handlers never call the upstream directly.
- Set **timeouts** shorter than the Lambda timeout (for example 5–10 s), with at most one retry for
  idempotent reads.
- Map upstream failures to Problem responses: unreachable or 5xx → `502`, overloaded → `503`,
  timeout → `504`. **Never pass upstream error bodies through**; log a summary with the request ID.
- Validate upstream responses before returning them (OWASP API10), and map to the spec's shape.
  The upstream's field names and quirks shouldn't leak into the City API.
- Credentials for the upstream go in Secrets Manager. Network access (VPC, VPN, allowlists) is an
  infrastructure decision, so ask.
- Respect upstream rate limits. Consider caching only for data that is public and slow-changing.

## Test data

All sample and test data is synthetic. Never copy production rows, resident names, addresses,
phone numbers, emails or case notes into fixtures, specs or seeds.
