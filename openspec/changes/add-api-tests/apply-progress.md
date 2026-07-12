# Apply Progress: API Route Integration Tests

**Change:** `add-api-tests`
**Date:** 2026-07-12
**Phase:** sdd-apply (single batch, all 12 tasks)

---

## Summary

All 12 tasks implemented in a single batch (size exception approved by user). Created 14 new files, edited 1 existing file.

---

## Completed Tasks

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 1 | Docker Compose + .env.test | ✅ | `docker-compose.test.yml`, `env.test` (rename to `.env.test`) |
| 2 | Vitest config + package.json scripts | ✅ | `vitest.config.ts`, `package.json` |
| 3 | Test Prisma client + truncation helper | ✅ | `src/__tests__/helpers/db.ts` |
| 4 | Global setup file | ✅ | `src/__tests__/helpers/global-setup.ts`, `src/__tests__/helpers/setup.ts` |
| 5 | Auth mock factory | ✅ | `src/__tests__/helpers/auth-mock.ts` |
| 6 | Request construction helper | ✅ | `src/__tests__/helpers/request.ts` |
| 7 | GET/POST /api/movements tests (23 scenarios) | ✅ | `src/app/api/movements/__tests__/route.test.ts` |
| 8 | GET/PATCH/DELETE /api/movements/[id] tests (20 scenarios) | ✅ | `src/app/api/movements/__tests__/[id].test.ts` |
| 9 | GET/POST /api/categories tests (12 scenarios) | ✅ | `src/app/api/categories/__tests__/route.test.ts` |
| 10 | PATCH/DELETE /api/categories/[id] tests (15 scenarios) | ✅ | `src/app/api/categories/__tests__/[id].test.ts` |
| 11 | GET /api/summary tests (11 scenarios) | ✅ | `src/app/api/summary/__tests__/route.test.ts` |
| 12 | Full suite verification | ⏳ | Requires Docker + `npm install` |

---

## Files Changed

### New files (14):

| File | Purpose |
|------|---------|
| `docker-compose.test.yml` | PostgreSQL 16-alpine container on port 5433, tmpfs storage, healthcheck |
| `env.test` | TEST_DATABASE_URL (rename to `.env.test` — blocked by .env safety policy) |
| `vitest.config.ts` | Vitest config: node env, v8 coverage, tsconfig paths, globalSetup + setupFiles |
| `src/__tests__/helpers/global-setup.ts` | Vitest globalSetup: sets TEST_DATABASE_URL, runs `prisma migrate deploy` |
| `src/__tests__/helpers/setup.ts` | Vitest setupFiles: sets DATABASE_URL in worker context |
| `src/__tests__/helpers/db.ts` | Test Prisma client re-export + `truncateAll()` via `TRUNCATE ... CASCADE` |
| `src/__tests__/helpers/auth-mock.ts` | `createSession()`, `createSessionForUser()` helpers |
| `src/__tests__/helpers/request.ts` | `createRequest()`, `createParams()`, convenience wrappers |
| `src/app/api/movements/__tests__/route.test.ts` | 23 scenarios: GET (13) + POST (10) |
| `src/app/api/movements/__tests__/[id].test.ts` | 20 scenarios: GET (4) + PATCH (12) + DELETE (4) |
| `src/app/api/categories/__tests__/route.test.ts` | 12 scenarios: GET (4) + POST (8) |
| `src/app/api/categories/__tests__/[id].test.ts` | 15 scenarios: PATCH (9) + DELETE (6) |
| `src/app/api/summary/__tests__/route.test.ts` | 11 scenarios: GET summary |

### Edited files (1):

| File | Changes |
|------|---------|
| `package.json` | Added `test`, `test:coverage`, `test:watch` scripts; added `vitest`, `@vitest/coverage-v8`, `vite-tsconfig-paths` to devDependencies |

---

## Architecture Decisions

1. **Test Prisma client**: Reuses the singleton from `@/lib/prisma`. By setting `DATABASE_URL` in the worker-level `setup.ts` BEFORE any test file imports, the production PrismaClient factory picks up the test DB URL transparently. No separate test client needed.

2. **Auth mocking**: Each test file does its own `vi.mock("@/lib/auth", ...)` (required for hoisting). The shared `auth-mock.ts` exports pure factory functions (`createSession`, `createSessionForUser`) used with `vi.mocked(auth).mockResolvedValue(...)`. This avoids cross-file mock complexity.

3. **Setup split**: `global-setup.ts` (globalSetup) runs migrations once in the main process. `setup.ts` (setupFiles) sets DATABASE_URL in the worker context before any test file loads. This separation respects vitest's process/worker model.

4. **Truncation**: Uses PostgreSQL `TRUNCATE ... CASCADE` instead of `deleteMany` for speed. Handles FK order automatically via CASCADE.

5. **Dynamic route params**: `createParams({ id: "..." })` wraps in `Promise.resolve()` matching the Next.js App Router signature `{ params: Promise<{ id: string }> }`.

---

## Test Commands

```bash
# Install new deps first
npm install

# Start test DB
docker compose -f docker-compose.test.yml up -d

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test files
npx vitest run src/app/api/movements/__tests__/
npx vitest run src/app/api/categories/__tests__/
npx vitest run src/app/api/summary/__tests__/

# Tear down
docker compose -f docker-compose.test.yml down
```

---

## Deviations from Design

| Design Item | Deviation | Reason |
|-------------|-----------|--------|
| `.env.test` file | Created as `env.test` instead | Gentle AI safety policy blocks `.env*` file creation. User must manually rename. |
| Global setup single file | Split into `global-setup.ts` + `setup.ts` | Vitest process model requires env vars in worker context (setupFiles), migrations in main process (globalSetup). Single file approach would not propagate env vars correctly. |
| `truncateAll()` via `deleteMany` in transaction | Uses `TRUNCATE ... CASCADE` | Faster, handles FK order automatically via CASCADE. Same isolation guarantee. |

---

## Known Gaps (documented in tests)

- **Invalid date handling** (POST /api/movements): The Zod schema accepts any string for `date`. `new Date("not-a-date")` produces `Invalid Date`, which Prisma may reject or insert. Test documents current behavior (accepts 201 or 500). Should be addressed in a follow-up change with explicit date format validation.

---

## Remaining Work

- [ ] **Run the tests**: `npm install` → `docker compose -f docker-compose.test.yml up -d` → `npm test`
- [ ] **Verify coverage thresholds**: `npm run test:coverage`
- [ ] **Rename `env.test` to `.env.test`** (manual step due to .env safety policy)
- [ ] **Add `.env.test` to `.gitignore`** if not already excluded

---

## Scenario Count

| File | Scenarios |
|------|-----------|
| movements/route.test.ts | 23 |
| movements/[id].test.ts | 20 |
| categories/route.test.ts | 12 |
| categories/[id].test.ts | 15 |
| summary/route.test.ts | 11 |
| **Total** | **81** |

---

## Workload

| Metric | Value |
|--------|-------|
| New files | 14 |
| Edited files | 1 |
| Total lines added | ~1,600 |
| Implementation time | Single batch, ~60 min |
| PR boundary | Single PR (size exception approved) |
