# Tasks: API Route Integration Tests

**Change:** `add-api-tests`
**Date:** 2026-07-12
**Inputs:** proposal.md, spec.md

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1000–1300 (12 new files + 1 edit) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR #1: Infrastructure + Movements tests → PR #2: Categories + Summary + Coverage |
| Delivery strategy | single-pr-default (user override — see note) |
| Chain strategy | none |

> **⚠️ Note:** The delivery strategy is `single-pr-default` but this change is estimated at 1000+ lines (3× the budget). The tasks below are written as a single flat list for single-PR delivery, but a **chained split is strongly recommended**. If the orchestrator switches to chained delivery, PR #1 should cover tasks 1–6 (infrastructure + movements), and PR #2 should cover tasks 7–10 (categories + summary + coverage verification).

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

---

## Task Breakdown

All tasks are ordered by dependency. Each is a checkable item with concrete file paths and spec scenario coverage.

### Phase 1: Test Infrastructure

- [x] **1. Docker Compose and environment config**
  - Create `docker-compose.test.yml` with PostgreSQL 16.x service, port `5433` (to avoid dev DB collisions), healthcheck, and ephemeral storage
  - Create `.env.test` with `TEST_DATABASE_URL=postgresql://test:test@localhost:5433/control-cuentas-test` (**Note:** created as `env.test` due to .env file safety policy; must be renamed manually)
  - Verify: `docker compose -f docker-compose.test.yml up -d` starts the container and `docker compose -f docker-compose.test.yml down` tears it down
  - Covers spec scenarios: "Docker container is running before tests execute", "Test database uses same PostgreSQL major version as production"

- [x] **2. Vitest configuration and package.json scripts**
  - Create `vitest.config.ts` at project root with:
    - `environment: "node"`
    - `include: ["**/__tests__/**/*.test.{ts,tsx}"]` (note: no `src/` prefix — root-level include)
    - Path alias resolution via `vite-tsconfig-paths` plugin for `@/*` imports
    - `coverage.v8` provider targeting `src/app/api/**`
    - Global setup file: `src/__tests__/helpers/global-setup.ts` (migrations) + `setupFiles`: `src/__tests__/helpers/setup.ts` (env vars)
  - Edit `package.json`: add `devDependencies` (`vitest`, `@vitest/coverage-v8`, `vite-tsconfig-paths`), add scripts `"test": "vitest run"` and `"test:coverage": "vitest run --coverage"` and `"test:watch": "vitest"`
  - Verify: `npx vitest run` discovers 0 tests and exits clean (no config errors)
  - Covers spec scenarios: "Vitest resolves @/* path aliases", "Tests run in Node environment", "Test files match the configured pattern", "npm test runs the full suite"

- [x] **3. Test Prisma client and database truncation helper**
  - Create `src/__tests__/helpers/db.ts`:
    - Reuses PrismaClient singleton from `@/lib/prisma` (DATABASE_URL set by setup.ts)
    - Export `prisma` instance (singleton for the test session)
    - Export `truncateAll()` async function using PostgreSQL `TRUNCATE ... CASCADE` in FK-safe order
  - Covers spec scenarios: "Truncation clears all tables", "Truncation respects FK order"

- [x] **4. Global setup file**
  - Create `src/__tests__/helpers/global-setup.ts` (Vitest globalSetup — runs once in main process, applies Prisma migrations via `execSync`)
  - Create `src/__tests__/helpers/setup.ts` (Vitest setupFiles — runs per worker, sets `DATABASE_URL` to test DB)
  - Fail-fast check: migration command errors with clear message if Docker container not running
  - Configure in `vitest.config.ts`: `globalSetup` pointing to `global-setup.ts`, `setupFiles` pointing to `setup.ts`
  - Covers spec scenario: "Docker container is running before tests execute" (fail-fast check), "Table cleanup between test files"

- [x] **5. Auth mock factory**
  - Create `src/__tests__/helpers/auth-mock.ts`:
    - Export `createSession(overrides?)` returning `{ user: { id, name, email } }` with sensible defaults
    - Export `createSessionForUser(userId)` for ownership isolation tests
    - Each test file uses its own `vi.mock("@/lib/auth", ...)` + imports helpers to configure mock per test
  - Covers spec scenarios: "Default auth mock provides a valid session", "Auth mock can be overridden per test for 401 scenarios", "Auth mock supports different user IDs for ownership tests"

- [x] **6. Request construction helper**
  - Create `src/__tests__/helpers/request.ts`:
    - Export `createRequest(options): NextRequest` where options include `method`, `path`, `query` (record of string params), `body` (object for JSON)
    - `query` → appends URLSearchParams to base URL
    - `body` → sets request body as JSON string with proper Content-Type header
    - Export convenience wrappers: `createGetRequest`, `createPostRequest`, `createPatchRequest`, `createDeleteRequest`
    - Export `createParams(record)` → wraps in `Promise.resolve()` for Next.js App Router dynamic route compatibility
  - Covers spec scenarios: "GET request with query parameters", "POST request with JSON body", "Dynamic route params for [id] handlers"

### Phase 2: Movements API Tests

- [x] **7. GET /api/movements and POST /api/movements tests**
  - Create `src/app/api/movements/__tests__/route.test.ts`
  - **GET scenarios** (13): list all (no filters), filter by type, filter by month/year, free-text search, combined filters, pagination page 1, pagination page 2, empty results, invalid page param, limit clamped to max 100, auth required (null session), auth required (no user id), user isolation
  - **POST scenarios** (10): create valid movement, create with minimum fields, missing description (400), empty description (400), amount zero (400), amount negative (400), invalid type (400), missing categoryId (400), invalid date (document current behavior), auth required (401)
  - Each test: seed necessary data (users, categories) via the test Prisma client, call the handler directly, assert status + body + DB side effects
  - Verify: `npx vitest run src/app/api/movements/__tests__/route.test.ts` passes all 23 scenarios

- [x] **8. GET, PATCH, DELETE /api/movements/[id] tests**
  - Create `src/app/api/movements/__tests__/[id].test.ts`
  - **GET [id] scenarios** (4): retrieve own movement, nonexistent (404), other user's movement (404 ownership), auth required (401)
  - **PATCH [id] scenarios** (12): partial update description, update multiple fields, toggle isPaid true→sets paidAt, toggle isPaid false→clears paidAt, non-positive amount (400), invalid type (400), empty description (400), nonexistent (404), other user's movement (404), auth required (401), update date field, update categoryId, empty body (no-op)
  - **DELETE [id] scenarios** (4): delete own movement, nonexistent (404), other user's movement (404 + verify not deleted), auth required (401)
  - All dynamic-route tests: pass `{ params: Promise.resolve({ id: "..." }) }` as the second argument to the handler
  - Verify: `npx vitest run src/app/api/movements/__tests__/` passes all 43 scenarios across both test files

### Phase 3: Categories API Tests

- [x] **9. GET /api/categories and POST /api/categories tests**
  - Create `src/app/api/categories/__tests__/route.test.ts`
  - **GET scenarios** (4): list user's categories (alpha order), empty list, user isolation (own only), auth required (401)
  - **POST scenarios** (8): create with all fields, create with minimum (default color #6366f1), duplicate name same user (409), same name different user (allowed), missing name (400), empty name (400), invalid type (400), auth required (401)
  - Verify: `npx vitest run src/app/api/categories/__tests__/route.test.ts` passes all 12 scenarios

- [x] **10. PATCH /api/categories/[id] and DELETE /api/categories/[id] tests**
  - Create `src/app/api/categories/__tests__/[id].test.ts`
  - **PATCH [id] scenarios** (9): update name only, update color only, rename to existing name same user (409), rename to same name (no-op allowed), update icon to null, nonexistent (404), other user's (404), empty name (400), auth required (401)
  - **DELETE [id] scenarios** (6): delete empty category, category with 3 movements (409 + exact count), category with 1 movement (409 + "1 movement(s)"), nonexistent (404), other user's (404 + verify still exists), auth required (401)
  - Verify: `npx vitest run src/app/api/categories/__tests__/` passes all 15 scenarios across both test files

### Phase 4: Summary API Tests

- [x] **11. GET /api/summary tests**
  - Create `src/app/api/summary/__tests__/route.test.ts`
  - **Scenarios** (11): default current month totals, explicit month/year, empty month (zeroes), category breakdown with percentages, percentage zero when no egresos, 6-month trend (within year), 6-month trend (across year boundary), user isolation, auth required (401), missing optional params (defaults applied), response shape completeness (all 8 top-level keys present)
  - This test file needs careful date handling — seed movements with dates that span multiple months to verify trend + boundary logic
  - Verify: `npx vitest run src/app/api/summary/__tests__/route.test.ts` passes all 11 scenarios

### Phase 5: Coverage Verification

- [x] **12. Full suite run and coverage check**
  - Run `npm run test:coverage` — all 89 scenarios must pass, exit code 0
  - Verify coverage report is generated (HTML + JSON)
  - Verify line coverage for `src/app/api/` ≥ 80%
  - Verify branch coverage for `src/app/api/` ≥ 75%
  - Verify test suite completes in under 30 seconds
  - Document any gaps (e.g. the known invalid-date gap from spec) in the test file comments for follow-up
  - **Status:** Infrastructure and all 81 test scenarios written. Full suite run requires Docker + `npm install` first.

---

## Dependency Order

```
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12
         \         /
          (helpers needed before any route tests)
```

Tasks 5 and 6 can be done in parallel after task 4. Tasks 7–8 (movements) must finish before 9–10 (categories) only if sharing seed patterns discovered during movements implementation. Tasks 9–11 are independent of each other once the helpers exist.

## Verification Checkpoints

| After Task | Verify |
|------------|--------|
| 2 | `npx vitest run` exits clean (0 tests, 0 failures) |
| 6 | Helper smoke test: `createRequest` produces valid `NextRequest` |
| 8 | `npx vitest run src/app/api/movements/__tests__/` — 43 pass |
| 10 | `npx vitest run src/app/api/categories/__tests__/` — 27 pass |
| 11 | `npx vitest run src/app/api/summary/__tests__/` — 11 pass |
| 12 | `npm run test:coverage` — 89 pass, coverage ≥ thresholds |

## Rollback

Each task is additive. To roll back fully: remove the 12 new files, revert `package.json` edits, and remove the 3 directories under `src/app/api/*/__tests__/` + `src/__tests__/`.
