# Proposal: API Route Integration Tests

**Change:** `add-api-tests`
**Status:** proposed
**Date:** 2026-07-12

---

## Intent

Add a Vitest-based integration test suite covering all existing API routes (movements, categories, summary) to establish a safety net before further feature work, refactoring, or production deployment. The project currently has zero tests and no test infrastructure.

## Scope

### In scope
- Integration tests for **5 route handlers** (10 HTTP verbs total):
  1. `GET /api/movements` — list with filters (type, month/year, search, pagination), empty results, invalid params
  2. `POST /api/movements` — create with validation (required fields, positive amount, valid type), invalid body, missing auth
  3. `GET /api/movements/[id]` — single movement retrieval, 404 for nonexistent/other-user movement
  4. `PATCH /api/movements/[id]` — partial update, paid toggle (sets `paidAt`), validation rejections, ownership check
  5. `DELETE /api/movements/[id]` — soft-delete via ownership check, 404 for missing
  6. `GET /api/categories` — list all for user, empty list, auth required
  7. `POST /api/categories` — create with duplicate-name rejection (409), default color, validation
  8. `PATCH /api/categories/[id]` — update + rename duplicate check (409), ownership guard
  9. `DELETE /api/categories/[id]` — deletion blocked when category has movements (409 with count), ownership guard
  10. `GET /api/summary` — monthly aggregates, category breakdown with percentages, 6-month trend, empty-month handling
- Vitest configuration and test infrastructure setup (see Design Decisions below)
- Test database provisioning via Docker
- Auth mocking strategy
- CI-ready `test` script in `package.json`

### Out of scope (for this change)
- Unit tests for individual functions/libraries (e.g., `api-response.ts`, validation schemas)
- Frontend/component tests (React Testing Library, Playwright)
- E2E browser tests
- Test coverage enforcement gates (CI will _report_ coverage; no hard fail threshold yet)
- Performance/load tests
- Testing auth flows (login, registration, session) — only the route-level auth guard is tested

## Design Decisions

### 1. Test Database Strategy: Docker PostgreSQL container

**Decision:** Use a disposable Docker PostgreSQL container managed via a `docker-compose.test.yml` file.

**Rationale:**
- The project uses `@prisma/adapter-pg` (PostgreSQL wire protocol adapter). SQLite in-memory is **not possible** — the adapter speaks only the Pg protocol.
- A Docker container gives every developer and CI the **same environment**, eliminating "works on my machine" drift.
- Containers are ephemeral: `docker compose -f docker-compose.test.yml up -d` before tests, `down` after.
- Prisma migrations are applied at test startup (`npx prisma migrate deploy` against the test DB).

**Alternative considered:** A separate test database on the developer's local PostgreSQL instance. Rejected because it requires manual setup, risks polluting the test DB between runs, and breaks in CI without additional provisioning.

**Prisma handling:** The test suite sets `TEST_DATABASE_URL` (pointing to the Docker container). A test helper reads this env var and instantiates a Prisma client. Between tests, a `prisma.$transaction([...deletes])` helper truncates all tables in correct FK order to keep tests isolated without dropping/recreating the schema.

### 2. Auth Mocking: Module-level mock of `@/lib/auth`

**Decision:** Mock `@/lib/auth` using Vitest's `vi.mock()` to inject a known session with a test user ID. Do NOT create a real NextAuth session/JWT.

**Rationale:**
- Every route handler calls `const session = await auth()` and gates on `session?.user?.id`.
- Mocking at the module boundary is the **least invasive** approach — it tests the actual route handler logic, not NextAuth internals.
- A real JWT would require: (a) a user with a hashed password in the test DB, (b) cookie/header construction matching NextAuth's format, (c) coupling to NextAuth's internal token structure. This adds fragility without benefit for route-level tests.
- Tests that need a _different_ user (for ownership isolation) can use a second mock or override per-test.

**Mock shape:**
```ts
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", name: "Test User", email: "test@example.com" },
  }),
}));
```

**Edge case coverage:** A separate test explicitly mocks `auth()` to return `null` to verify the 401 unauthorized path.

### 3. Test File Organization: Co-located `__tests__` directories

**Decision:**
```
src/app/api/
├── movements/
│   ├── __tests__/
│   │   ├── route.test.ts         # GET & POST /api/movements
│   │   └── [id].test.ts          # GET, PATCH, DELETE /api/movements/[id]
│   ├── route.ts
│   └── [id]/
│       └── route.ts
├── categories/
│   ├── __tests__/
│   │   ├── route.test.ts         # GET & POST /api/categories
│   │   └── [id].test.ts          # PATCH & DELETE /api/categories/[id]
│   ├── route.ts
│   └── [id]/
│       └── route.ts
└── summary/
    ├── __tests__/
    │   └── route.test.ts         # GET /api/summary
    └── route.ts
```

Plus a shared test infrastructure directory at `src/__tests__/helpers/` containing:
- `setup.ts` — global Vitest setup (Docker check, migration, Prisma client)
- `db.ts` — test Prisma client + truncation helpers
- `auth-mock.ts` — reusable auth mock factory
- `request.ts` — thin wrapper for constructing `NextRequest` with query params/body

**Rationale:** Co-location follows Next.js conventions and keeps tests discoverable. Shared helpers in `src/__tests__/` avoid duplication across route groups.

### 4. Coverage Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Lines | ≥ 80% | Core route logic |
| Branches | ≥ 75% | Error paths, auth guards, validation |
| Functions | ≥ 80% | Each route handler exercised |
| Statements | ≥ 80% | — |

No CI hard-fail gate on this first change. Coverage is reported via `vitest --coverage` (using `@vitest/coverage-v8`). A hard gate can be added in a follow-up once the team has a baseline.

### 5. Vitest Configuration

- **Runner:** `vitest` (already chosen by user)
- **Environment:** `node` (routes don't need DOM)
- **Transform:** `vite-tsconfig-paths` for `@/*` path aliases
- **Setup file:** `src/__tests__/helpers/setup.ts` (global setup — DB migration, Prisma connection)
- **Coverage provider:** `v8` (built-in, no Istanbul native deps needed)
- **Test match:** `**/__tests__/**/*.test.{ts,tsx}`

### 6. Test Pattern: Request → Handler → Assert Response

Each test:
1. **Arrange:** Seed test data via Prisma, set up auth mock
2. **Act:** Import and call the route handler directly with a `NextRequest`
3. **Assert:** Parse the `NextResponse`, check status code, body shape, and side effects in the database

This is a **true integration test**: it exercises the route handler end-to-end (validation, auth, DB queries, response formatting) without spinning up an HTTP server. Direct handler invocation keeps tests fast and debuggable.

## Affected Areas

| Area | Impact |
|------|--------|
| `package.json` | New `devDependencies` (vitest, @vitest/coverage-v8, vite-tsconfig-paths), new `test` and `test:coverage` scripts |
| `vitest.config.ts` | New file at project root |
| `docker-compose.test.yml` | New file at project root |
| `src/__tests__/` | New directory with shared test helpers |
| `src/app/api/*/__tests__/` | New test files alongside each route group |
| `.env.test` | New file with `TEST_DATABASE_URL` |
| Prisma schema | No changes required |

No production code changes. This is purely additive.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Docker not available in all dev environments | Medium | High — tests can't run | Document fallback: manual test DB setup via `.env.test` pointing to local PostgreSQL |
| `@prisma/adapter-pg` behavior differs between test and production | Low | Medium | Use same PostgreSQL version in Docker as production (16.x) |
| Prisma client generation path (`src/generated/db/`) causes import issues in Vitest | Medium | Medium | Verify with `vite-tsconfig-paths`; add explicit alias if needed |
| Test execution time grows with DB round-trips | Low | Low | Truncation-based cleanup avoids migration-per-test; target <5s per test file |
| Mocking `@/lib/auth` hides integration issues with NextAuth itself | Low | Low | Auth is tested implicitly via manual QA; this proposal adds route-level safety, not auth-level |
| Zero tests today → no culture of testing | Medium | Medium | Keep initial scope small, tests simple, CI feedback fast. Add a testing section to README |

## Rollback

If the test suite causes issues:
1. Remove `vitest`, `@vitest/coverage-v8`, `vite-tsconfig-paths` from `devDependencies`
2. Delete `vitest.config.ts`, `docker-compose.test.yml`, `.env.test`
3. Delete `src/__tests__/` directories
4. Remove `test` and `test:coverage` scripts from `package.json`

No other code depends on these files. Rollback is a clean revert of the commit.

## Success Criteria

1. `npm test` runs all API route integration tests and passes
2. Every route handler has coverage for: happy path, auth required (401), validation errors (400), and at least one ownership/isolation check
3. Coverage report shows ≥80% lines, ≥75% branches across the `src/app/api/` directory
4. Tests pass in a clean checkout with only Docker and `npm install` as prerequisites
5. Test suite completes in under 30 seconds

## Dependencies

- `vitest` ≥ 3.x
- `@vitest/coverage-v8` ≥ 3.x
- `vite-tsconfig-paths` ≥ 5.x (for `@/*` path resolution in tests)
- Docker (developer machines and CI)
- Existing Prisma schema (no changes needed — test DB uses same migrations)

## Next Phase

`sdd-spec` — write detailed acceptance criteria for each route handler test, defining exact request shapes, expected responses, and edge cases per endpoint.
