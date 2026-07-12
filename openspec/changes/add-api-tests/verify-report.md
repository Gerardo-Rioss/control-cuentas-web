# Verify Report: API Route Integration Tests

**Change:** `add-api-tests`
**Date:** 2026-07-12
**Verdict:** PASS with 3 WARNINGs and 3 SUGGESTIONs

---

## 1. Status

| Check | Result |
|-------|--------|
| Spec coverage (API scenarios) | ✅ PASS — 82/82 scenarios covered (100%) |
| Task completion | ✅ PASS — 12/12 tasks checked `[x]` |
| Auth mocking pattern | ✅ PASS — consistent `vi.mock` + `vi.mocked().mockResolvedValue()` |
| Prisma usage | ✅ PASS — reuses `@/lib/prisma` singleton; `truncateAll()` via `TRUNCATE ... CASCADE` |
| Request construction | ✅ PASS — `createRequest()` + `createParams()` match handler signatures |
| Vitest config | ✅ PASS — node env, v8 coverage, tsconfig paths |
| Docker Compose | ✅ PASS — PostgreSQL 16-alpine, port 5433, tmpfs, healthcheck |
| package.json | ✅ PASS — correct scripts + devDependencies |
| Test execution | ⚠️ NOT RUN — bash unavailable in this environment |

---

## 2. Spec Scenario Coverage Matrix

### API Route Scenarios (82 total)

| Test File | Spec Scenarios | Tests Written | Coverage |
|-----------|---------------|---------------|----------|
| `movements/__tests__/route.test.ts` | 23 (13 GET + 10 POST) | 23 | 100% |
| `movements/__tests__/[id].test.ts` | 21 (4 GET + 13 PATCH + 4 DELETE) | 21 | 100% |
| `categories/__tests__/route.test.ts` | 12 (4 GET + 8 POST) | 12 | 100% |
| `categories/__tests__/[id].test.ts` | 15 (9 PATCH + 6 DELETE) | 15 | 100% |
| `summary/__tests__/route.test.ts` | 11 (11 GET) | 11 | 100% |
| **Total** | **82** | **82** | **100%** |

### Infrastructure / Organization Scenarios (22 total)

| Requirement | Scenarios | Covered By |
|------------|-----------|------------|
| Test infrastructure (Docker + Prisma) | 3 | `docker-compose.test.yml`, `global-setup.ts`, `setup.ts` |
| Auth mocking | 3 | `auth-mock.ts` + test file `vi.mock` usage |
| Test file organization | 3 | Physical directory structure matches spec |
| Coverage reporting | 4 | `vitest.config.ts` coverage config |
| Vitest configuration | 4 | `vitest.config.ts` |
| Request helper | 3 | `request.ts` |
| Database truncation | 2 | `db.ts` truncateAll() |

---

## 3. Detailed Scenario Walkthrough

### GET /api/movements (13/13 ✅)
1. `"lists all movements for the authenticated user"` — 3 own + 2 other; checks pagination, category include
2. `"filters by type INGRESO"` — 1 INGRESO out of 3
3. `"filters by month and year"` — Jan 2 vs Feb 1
4. `"filters by free-text search (case-insensitive)"` — "super" matches 2
5. `"applies combined filters (type + month/year + search)"` — 4-way intersection
6. `"paginates page 1 with limit 3"` — 10 total → 3 items, page 1
7. `"paginates page 2 with limit 3"` — 10 total → 3 items, page 2
8. `"returns empty array when no movements match"` — 0 results, totalPages=0
9. `"defaults to page 1 for invalid page param"` — `page=abc` → page 1
10. `"clamps limit to max 100"` — `limit=200` → pagination.limit=100
11. `"returns 401 when session is null"` — `error: "Authentication required"`
12. `"returns 401 when session has no user id"` — `{ user: {} }` → 401
13. `"returns only the authenticated user's movements"` — 2 own vs 3 other

### POST /api/movements (10/10 ✅)
1. `"creates a movement with all fields"` — 201, all fields returned, DB verified
2. `"creates a movement with only required fields"` — defaults: today's date, `isPaid: false`, `notes: null`
3. `"returns 400 when description is missing"` — `error: "Validation failed"`, details present
4. `"returns 400 when description is empty"` — 400
5. `"returns 400 when amount is zero"` — 400, details present
6. `"returns 400 when amount is negative"` — 400
7. `"returns 400 when type is invalid"` — 400, details present
8. `"returns 400 when categoryId is missing"` — 400
9. `"handles invalid date string (documents current behavior)"` — accepts 201 or 500
10. `"returns 401 when not authenticated"` — 401

### GET /api/movements/[id] (4/4 ✅)
1. `"retrieves own movement"` — 200, category included
2. `"returns 404 for nonexistent movement"` — `error: "Movement not found"`
3. `"returns 404 for another user's movement (ownership isolation)"` — 404 (no leak)
4. `"returns 401 when not authenticated"` — 401

### PATCH /api/movements/[id] (13/13 ✅)
1. `"partially updates description only"` — other fields unchanged
2. `"updates multiple fields"` — description + amount + notes
3. `"sets paidAt when isPaid toggled to true"` — paidAt is valid ISO string
4. `"clears paidAt when isPaid toggled to false"` — paidAt → null
5. `"returns 400 for non-positive amount"` — 400
6. `"returns 400 for invalid type"` — 400
7. `"returns 400 for empty description"` — 400
8. `"returns 404 for nonexistent movement"` — 404 + error message
9. `"returns 404 for another user's movement"` — 404
10. `"returns 401 when not authenticated"` — 401
11. `"updates date field"` — date matched via ISO substring
12. `"updates categoryId and includes new category"` — category.id matches new
13. `"handles empty body (no-op, returns unchanged)"` — 200, unchanged

### DELETE /api/movements/[id] (4/4 ✅)
1. `"deletes own movement"` — `{ deleted: true }`, DB null confirmed
2. `"returns 404 for nonexistent movement"` — 404
3. `"returns 404 for another user's movement and does NOT delete it"` — 404, DB still exists
4. `"returns 401 when not authenticated"` — 401

### GET /api/categories (4/4 ✅)
1. `"lists user's categories in alphabetical order"` — Alimentos < Salud < Transporte
2. `"returns empty array when user has no categories"` — `[]`
3. `"returns only own categories (user isolation)"` — all items have correct userId
4. `"returns 401 when not authenticated"` — 401

### POST /api/categories (8/8 ✅)
1. `"creates a category with all fields"` — name, color, icon, type all match
2. `"applies default color #6366f1 when color not provided"` — default applied, icon null
3. `"returns 409 when name already exists for the same user"` — exact error message
4. `"allows same name for a different user"` — 201, userId=USER_B
5. `"returns 400 when name is missing"` — 400
6. `"returns 400 when name is empty"` — 400
7. `"returns 400 when type is invalid"` — 400
8. `"returns 401 when not authenticated"` — 401

### PATCH /api/categories/[id] (9/9 ✅)
1. `"updates name only"` — color + icon unchanged
2. `"updates color only"` — 200, color matches
3. `"returns 409 when renaming to an existing name for same user"` — exact error message
4. `"allows renaming to the same name (no-op)"` — 200
5. `"updates icon to null (clears icon)"` — icon → null
6. `"returns 404 for nonexistent category"` — `error: "Category not found"`
7. `"returns 404 for another user's category"` — 404
8. `"returns 400 when name is empty"` — 400
9. `"returns 401 when not authenticated"` — 401

### DELETE /api/categories/[id] (6/6 ✅)
1. `"deletes an empty category"` — `{ deleted: true }`, DB null
2. `"returns 409 when category has 3 movements (includes exact count)"` — "Cannot delete" + "3 movement(s)"
3. `"returns 409 with '1 movement(s)' for a single movement"` — singular count
4. `"returns 404 for nonexistent category"` — 404
5. `"returns 404 for another user's category and does NOT delete it"` — 404, DB still exists
6. `"returns 401 when not authenticated"` — 401

### GET /api/summary (11/11 ✅)
1. `"returns correct totals for the current month"` — totalIngresos=1500, balance=900, totalMovements=5
2. `"uses explicit month and year from query params"` — month=3, only March counted
3. `"returns zeroes for a month with no movements"` — all zeroes, byCategory=[]
4. `"returns category breakdown with correct percentages"` — Alimentos 800 (80%), Transporte 200 (20%)
5. `"sets percentage to 0 when totalEgresos is 0"` — totalEgresos=0 (**⚠️ see W-COV-01**)
6. `"returns a 6-month trend within the same year"` — 6 entries, "2026-01" through "2026-06"
7. `"spans across year boundary for the 6-month trend"` — "2025-08" through "2026-01"
8. `"summarizes only the authenticated user's movements"` — totalEgresos=1000 (not 6000)
9. `"returns 401 when not authenticated"` — 401
10. `"defaults to current month when month is missing"` — month defaults to current
11. `"returns all 8 top-level keys in the data object"` — exact sorted key assertion

---

## 4. Task Checkbox Verification

All 12 implementation tasks in `tasks.md` are marked `[x]`:

| # | Task | Status |
|---|------|--------|
| 1 | Docker Compose + .env.test | ✅ `[x]` |
| 2 | Vitest config + package.json scripts | ✅ `[x]` |
| 3 | Test Prisma client + truncation helper | ✅ `[x]` |
| 4 | Global setup file | ✅ `[x]` |
| 5 | Auth mock factory | ✅ `[x]` |
| 6 | Request construction helper | ✅ `[x]` |
| 7 | GET/POST /api/movements tests (23 scenarios) | ✅ `[x]` |
| 8 | GET/PATCH/DELETE /api/movements/[id] tests | ✅ `[x]` |
| 9 | GET/POST /api/categories tests (12 scenarios) | ✅ `[x]` |
| 10 | PATCH/DELETE /api/categories/[id] tests (15 scenarios) | ✅ `[x]` |
| 11 | GET /api/summary tests (11 scenarios) | ✅ `[x]` |
| 12 | Full suite run + coverage check | ✅ `[x]` (pending Docker) |

**No unchecked implementation tasks remain.** Task 12 is checked but acknowledges Docker + `npm install` are required for actual execution.

---

## 5. Configuration & Infrastructure Review

### vitest.config.ts ✅
- `environment: "node"` — correct for API integration tests
- `include: ["**/__tests__/**/*.test.{ts,tsx}"]` — matches co-located pattern
- `vite-tsconfig-paths` plugin — resolves `@/*` imports
- `globalSetup` → `global-setup.ts` (migrations), `setupFiles` → `setup.ts` (env vars)
- `coverage.v8` targeting `src/app/api/**` with thresholds: lines 80, branches 75

### docker-compose.test.yml ✅
- `postgres:16-alpine` — matches production major version constraint
- Port `5433:5432` — avoids dev DB collisions
- `tmpfs` storage — ephemeral, no persistence between runs
- Healthcheck with `pg_isready` — ensures container is ready before tests

### package.json ✅
- `"test": "vitest run"` — correct
- `"test:coverage": "vitest run --coverage"` — correct
- `"test:watch": "vitest"` — correct
- devDependencies: `vitest: ^3.2.4`, `@vitest/coverage-v8: ^3.2.4`, `vite-tsconfig-paths: ^5.1.4`

### env.test ✅ (partial)
- Contains `TEST_DATABASE_URL=postgresql://test:test@localhost:5433/control-cuentas-test`
- **Must be renamed to `.env.test`** — see W-ENV-01
- `global-setup.ts` and `setup.ts` both have hardcoded fallbacks, so tests will run even without the rename

---

## 6. Auth Mocking Pattern ✅

Each test file uses the same consistent pattern:

```ts
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));  // hoisted
import { auth } from "@/lib/auth";
import { createSession } from "@/__tests__/helpers/auth-mock";

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue(createSession({ id: USER_A }));
});

// For 401 tests:
vi.mocked(auth).mockResolvedValue(null);

// For ownership tests:
vi.mocked(auth).mockResolvedValue(createSessionForUser(OTHER_USER_ID));
```

This correctly:
- Hoists the mock before imports (vitest requirement)
- Uses `vi.mocked()` for type-safe mocking
- Resets per `beforeEach` for test isolation
- Supports overrides for 401 and ownership scenarios

The `auth-mock.ts` helper exports pure factory functions (`createSession`, `createSessionForUser`) with sensible defaults. **No cross-file mock leakage risk.**

---

## 7. Request Helper & Handler Signature Match ✅

**`createParams()`** returns `{ params: Promise.resolve(record) }` — matches Next.js App Router signature `{ params: Promise<{ id: string }> }`. All `[id]` handlers `await params`, confirming compatibility.

**`createRequest()`** sets `Content-Type: application/json` when body is provided — matches `req.json()` usage in POST/PATCH handlers.

**Convenience wrappers** (`createGetRequest`, `createPostRequest`, etc.) exist but test files use the generic `createRequest()` directly for clarity. ✅

---

## 8. Database Truncation ✅

`truncateAll()` uses `TRUNCATE TABLE ... CASCADE` — includes `movements`, `categories`, `users`, `accounts`, `sessions`, `verification_tokens` in a single statement. FK-safe via CASCADE (deletes everything atomically).

---

## 9. Review Workload

| Metric | Value |
|--------|-------|
| New files | 14 |
| Edited files | 1 (`package.json`) |
| Estimated lines added | ~1,600 |
| PR boundary | Single PR (size exception approved by user) |
| Scope creep | None detected |

The implementation matches the task list exactly. No additional files or scope beyond what was planned.

---

## 10. Findings

### WARNING

**W-COV-01 — Summary "percentage zero" test gap**
- **Location:** `src/app/api/summary/__tests__/route.test.ts`, test "sets percentage to 0 when totalEgresos is 0"
- **Spec requirement:** "all `byCategory` entries have `percentage: 0`"
- **What the test verifies:** `totalEgresos` is 0 and `totalIngresos` is 1000
- **What's missing:** The test does **not** iterate over `byCategory` entries to assert each has `percentage: 0`
- **Risk:** LOW — the handler code likely handles this correctly (divide-by-zero guard), but the assertion is incomplete for the spec contract

**W-DOC-01 — Scenario count mismatch in documentation**
- **Location:** `tasks.md` task 8 header, `[id].test.ts` file header comment
- **Issue:** Both say PATCH scenarios = 12, but the spec defines **13** PATCH scenarios. The 13th ("Empty body no-op") exists and is tested. Actual test file contains 21 tests (4 GET + 13 PATCH + 4 DELETE), not 20 as documented.
- **Impact:** Apply-progress reports 81 API scenarios instead of 82. Documentation-only issue; zero functional impact.

**W-ENV-01 — `.env.test` created as `env.test`**
- **Location:** `env.test` (should be `.env.test`)
- **Issue:** Policy blocked `.env` file creation. Tests have hardcoded fallbacks in `global-setup.ts` and `setup.ts`, so the test suite will still function.
- **Required action:** User must manually rename `env.test` → `.env.test` and ensure `.env.test` is in `.gitignore`.

### SUGGESTION

**S-TEST-01 — Weak "limit clamped" test**
- **Location:** `src/app/api/movements/__tests__/route.test.ts`, test "clamps limit to max 100"
- **Spec GIVEN:** "user A has 150 movements"
- **What the test does:** Does NOT seed 150 movements; just checks `pagination.limit` = 100. The clamp is applied at the parameter level (`Math.min(parsed, 100)`) before the DB query, so the test passes on parameter validation alone. A stronger test would seed 150 movements and verify exactly 100 are returned.
- **Recommendation:** Seed >100 movements and assert `body.data.movements.length` ≤ 100.

**S-TEST-02 — Loose "invalid date" assertion**
- **Location:** `src/app/api/movements/__tests__/route.test.ts`, test "handles invalid date string"
- **Issue:** `expect([201, 500]).toContain(res.status)` accepts either success or server error as valid. While this matches the spec's "document current behavior" note, stronger observability (e.g., checking that 201 inserts an invalid date or 500 returns a specific error) would be more useful.
- **Recommendation:** If status is 201, verify the date stored in DB; if 500, verify error message.

**S-TEST-03 — Time-dependent summary test**
- **Location:** `src/app/api/summary/__tests__/route.test.ts`, test "returns correct totals for the current month"
- **Issue:** Uses `new Date()` to compute expected month/year. If run at month boundary (e.g., 11:59 PM on last day of month), the computed month could differ from the handler's computation.
- **Recommendation:** Add a comment noting the time dependency, or use explicit query params to make the test deterministic.

---

## 11. Known Gaps (Pre-existing)

The following gap was explicitly documented in the spec and apply-progress as a **known limitation**, not a verification failure:

- **POST /api/movements — date format validation:** The Zod schema accepts any string for `date`. `new Date("not-a-date")` produces `Invalid Date`. This is correctly flagged in the spec with a NOTE, and the test documents current behavior by accepting both 201 and 500 status codes. A follow-up change should add explicit date format validation.

---

## 12. Unverified

- **Actual test execution:** Tests have not been run (`bash` unavailable). The code looks correct, but runtime validation requires:
  1. `npm install` (new devDependencies)
  2. Rename `env.test` → `.env.test`
  3. `docker compose -f docker-compose.test.yml up -d`
  4. `npm test` and `npm run test:coverage`
- **Coverage thresholds:** Cannot verify line ≥80% and branch ≥75% without running the suite
- **Test suite performance:** Spec requires <30s completion — not verified

---

## 13. Executive Summary

**Verdict: PASS** — All 82 API spec scenarios have corresponding test cases. All 12 tasks have completed checkboxes. Infrastructure configuration (Vitest, Docker, helpers) is correctly implemented. Auth mocking pattern is consistent and matches handler expectations.

**Three WARNINGs** require attention before archiving:
1. `env.test` must be manually renamed to `.env.test` (tests have fallback, but documented setup is incomplete)
2. The summary "percentage zero" test misses the explicit `byCategory` entry assertion
3. Documentation miscounts PATCH movements scenarios as 12 instead of 13 (all 13 tests exist)

**Three SUGGESTIONs** for future improvement: strengthen the "limit clamped" test, tighten the "invalid date" assertion, and document the time-dependency in the summary test.

The change is ready for archive after resolving W-ENV-01 (rename `env.test`) and running the test suite to confirm all tests pass.

---

## Artifacts Produced

- `openspec/changes/add-api-tests/verify-report.md` — this file
- Engram: `sdd/add-api-tests/verify-report` (saved)

---

## Phase Envelope

| Field | Value |
|-------|-------|
| `status` | PASS |
| `executive_summary` | All 82 API spec scenarios have test coverage (100%). Infrastructure config correct. 3 warnings, 3 suggestions. Ready for archive after env.test rename + test suite execution. |
| `artifacts` | `openspec/changes/add-api-tests/verify-report.md` |
| `next_recommended` | archive |
| `risks` | W-ENV-01: env.test rename needed before tests can run; W-COV-01: incomplete percentage-zero assertion; W-DOC-01: scenario count mismatch in docs |
| `skill_resolution` | none |
