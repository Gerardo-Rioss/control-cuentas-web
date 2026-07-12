# API Route Integration Tests Specification

## Purpose

Define the acceptance criteria and test scenarios for Vitest-based integration tests covering all 10 API route handler verbs (movements, categories, summary). This spec defines WHAT must be true after the change — correct behavior under all paths — not HOW tests are implemented.

## Requirements

---

### Requirement: GET /api/movements — List movements with filters

The system MUST return a paginated list of movements owned by the authenticated user, with optional filtering by type, month/year, and free-text search.

#### Scenario: List all movements for authenticated user (no filters)

- GIVEN the test database has 3 movements for user A and 2 movements for user B
- WHEN GET /api/movements is called with user A's auth session
- THEN the response status is 200
- AND `response.data.movements` is an array of 3 items
- AND each movement includes its `category` object (with at least `id`, `name`, `color`)
- AND `response.data.pagination` is `{ page: 1, limit: 50, total: 3, totalPages: 1 }`

#### Scenario: Filter by type (INGRESO)

- GIVEN user A has 2 EGreso movements and 1 INGRESO movement
- WHEN GET /api/movements?type=INGRESO
- THEN `response.data.movements` contains exactly 1 item
- AND all returned movements have `type: "INGRESO"`
- AND `response.data.pagination.total` is 1

#### Scenario: Filter by month and year

- GIVEN user A has movements with dates 2026-01-15, 2026-01-20, and 2026-02-05
- WHEN GET /api/movements?month=1&year=2026
- THEN `response.data.movements` contains exactly 2 items (January only)
- AND `response.data.pagination.total` is 2

#### Scenario: Free-text search on description

- GIVEN user A has movements with descriptions "Supermercado", "SuperVea", and "Farmacia"
- WHEN GET /api/movements?search=super
- THEN `response.data.movements` contains exactly 2 items (case-insensitive match on "Supermercado" and "SuperVea")
- AND `response.data.pagination.total` is 2

#### Scenario: Combined filters

- GIVEN user A has multiple movements across types and dates
- WHEN GET /api/movements?type=EGRESO&month=3&year=2026&search=luz
- THEN results are filtered by all three criteria
- AND `response.data.pagination.total` reflects only the intersection

#### Scenario: Pagination — page 1 with limit

- GIVEN user A has 10 movements
- WHEN GET /api/movements?page=1&limit=3
- THEN `response.data.movements` contains exactly 3 items
- AND `response.data.pagination` is `{ page: 1, limit: 3, total: 10, totalPages: 4 }`

#### Scenario: Pagination — page 2

- GIVEN user A has 10 movements
- WHEN GET /api/movements?page=2&limit=3
- THEN `response.data.movements` contains the 4th–6th items (by date descending)
- AND `response.data.pagination.page` is 2

#### Scenario: Empty results

- GIVEN user A has no movements matching the filter
- WHEN GET /api/movements?search=nonexistent
- THEN the response status is 200
- AND `response.data.movements` is an empty array `[]`
- AND `response.data.pagination.total` is 0
- AND `response.data.pagination.totalPages` is 0

#### Scenario: Invalid page parameter (non-numeric)

- WHEN GET /api/movements?page=abc
- THEN `response.data.pagination.page` is 1 (defaults, because `parseInt("abc")` is `NaN`, and `NaN || "1"` yields `"1"`)
- AND the response is 200

#### Scenario: Limit clamped to max 100

- GIVEN user A has 150 movements
- WHEN GET /api/movements?limit=200
- THEN `response.data.movements` contains at most 100 items
- AND `response.data.pagination.limit` is 100

#### Scenario: Auth required — no session

- GIVEN the auth mock returns `null`
- WHEN GET /api/movements is called
- THEN the response status is 401
- AND `response.error` is `"Authentication required"`

#### Scenario: Auth required — session with no user id

- GIVEN the auth mock returns `{ user: {} }` (no id field)
- WHEN GET /api/movements is called
- THEN the response status is 401

#### Scenario: User isolation — only own movements returned

- GIVEN user A has 2 movements and user B has 3 movements
- WHEN GET /api/movements is called with user A's auth session
- THEN all returned movements belong to user A
- AND no movement belonging to user B is in the response

---

### Requirement: POST /api/movements — Create a movement

The system MUST create a new movement for the authenticated user after validating the request body against the schema.

#### Scenario: Create a valid movement

- GIVEN a valid category exists for the test user
- WHEN POST /api/movements with body:
  ```json
  {
    "description": "Supermercado",
    "amount": 150.50,
    "type": "EGRESO",
    "categoryId": "<valid-category-id>",
    "date": "2026-07-10",
    "isPaid": false,
    "notes": "Compra semanal"
  }
  ```
- THEN the response status is 201
- AND `response.data` contains the created movement with all fields
- AND `response.data.category` is included (with `id`, `name`, `color`)
- AND `response.data.userId` matches the auth session user id
- AND `response.data.date` is the provided date
- AND `response.data.amount` is the provided amount (as a Decimal/number)

#### Scenario: Create movement without optional fields (minimum valid body)

- WHEN POST /api/movements with body:
  ```json
  {
    "description": "Café",
    "amount": 5.00,
    "type": "EGRESO",
    "categoryId": "<valid-category-id>"
  }
  ```
- THEN the response status is 201
- AND `response.data.date` defaults to the current date
- AND `response.data.isPaid` is `false`
- AND `response.data.notes` is `null`

#### Scenario: Validation — missing required field (description)

- WHEN POST /api/movements with body `{ "amount": 100, "type": "EGRESO", "categoryId": "..." }` (no description)
- THEN the response status is 400
- AND `response.error` is `"Validation failed"`
- AND `response.details` contains field errors for `description`

#### Scenario: Validation — empty description

- WHEN POST /api/movements with body `{ "description": "", "amount": 100, "type": "EGRESO", "categoryId": "..." }`
- THEN the response status is 400

#### Scenario: Validation — amount is zero or negative

- WHEN POST /api/movements with body `{ "description": "X", "amount": 0, "type": "EGRESO", "categoryId": "..." }`
- THEN the response status is 400
- AND `response.details` indicates amount must be positive

#### Scenario: Validation — amount is negative

- WHEN POST /api/movements with body `{ "description": "X", "amount": -50, "type": "EGRESO", "categoryId": "..." }`
- THEN the response status is 400

#### Scenario: Validation — invalid type

- WHEN POST /api/movements with body `{ "description": "X", "amount": 100, "type": "INVALIDO", "categoryId": "..." }`
- THEN the response status is 400
- AND `response.details` indicates type must be "EGRESO" or "INGRESO"

#### Scenario: Validation — missing categoryId

- WHEN POST /api/movements with body `{ "description": "X", "amount": 100, "type": "EGRESO" }`
- THEN the response status is 400

#### Scenario: Validation — invalid date string

- GIVEN Zod does not validate date string format beyond optional string
- WHEN POST /api/movements with body `{ "description": "X", "amount": 100, "type": "EGRESO", "categoryId": "...", "date": "not-a-date" }`
- THEN the system passes `new Date("not-a-date")` to Prisma (which produces `Invalid Date`)
- NOTE: This is a known gap — date format validation is not enforced by the schema. The test should document the current behavior (Prisma may reject or insert Invalid Date). This SHOULD be addressed in a follow-up change.

#### Scenario: Auth required — no session

- GIVEN the auth mock returns `null`
- WHEN POST /api/movements with a valid body
- THEN the response status is 401

---

### Requirement: GET /api/movements/[id] — Retrieve a single movement

The system MUST return a single movement by id if it exists and belongs to the authenticated user; otherwise it MUST return 404.

#### Scenario: Retrieve own movement

- GIVEN user A has a movement with id `M1`
- WHEN GET /api/movements/M1 with user A's auth session
- THEN the response status is 200
- AND `response.data.id` is `"M1"`
- AND `response.data.category` is included

#### Scenario: Movement does not exist

- GIVEN no movement has id `NONEXISTENT`
- WHEN GET /api/movements/NONEXISTENT with any authenticated user
- THEN the response status is 404
- AND `response.error` is `"Movement not found"`

#### Scenario: Movement belongs to another user (ownership isolation)

- GIVEN user B has a movement with id `M2`
- WHEN GET /api/movements/M2 with user A's auth session
- THEN the response status is 404
- AND `response.error` is `"Movement not found"`
- NOTE: The system MUST NOT leak existence — user A receives 404 (not 403) regardless of whether the movement exists for another user.

#### Scenario: Auth required — no session

- WHEN GET /api/movements/M1 without auth
- THEN the response status is 401

---

### Requirement: PATCH /api/movements/[id] — Update a movement

The system MUST partially update a movement if it exists and belongs to the authenticated user, applying validation to the provided fields and toggling `paidAt` based on `isPaid`.

#### Scenario: Partial update — change description only

- GIVEN user A has a movement `M1` with description "Old name"
- WHEN PATCH /api/movements/M1 with body `{ "description": "New name" }`
- THEN the response status is 200
- AND `response.data.description` is `"New name"`
- AND all other fields remain unchanged

#### Scenario: Update multiple fields

- WHEN PATCH /api/movements/M1 with body `{ "description": "Updated", "amount": 200, "notes": "New note" }`
- THEN the response status is 200
- AND all three fields are updated
- AND unchanged fields retain their original values

#### Scenario: Toggle isPaid from false to true — sets paidAt

- GIVEN user A has movement `M1` with `isPaid: false` and `paidAt: null`
- WHEN PATCH /api/movements/M1 with body `{ "isPaid": true }`
- THEN the response status is 200
- AND `response.data.isPaid` is `true`
- AND `response.data.paidAt` is a valid ISO date string (set to now)

#### Scenario: Toggle isPaid from true to false — clears paidAt

- GIVEN user A has movement `M1` with `isPaid: true` and `paidAt` non-null
- WHEN PATCH /api/movements/M1 with body `{ "isPaid": false }`
- THEN `response.data.isPaid` is `false`
- AND `response.data.paidAt` is `null`

#### Scenario: Validation — non-positive amount

- WHEN PATCH /api/movements/M1 with body `{ "amount": -10 }`
- THEN the response status is 400

#### Scenario: Validation — invalid type

- WHEN PATCH /api/movements/M1 with body `{ "type": "FOO" }`
- THEN the response status is 400

#### Scenario: Validation — empty description

- WHEN PATCH /api/movements/M1 with body `{ "description": "" }`
- THEN the response status is 400

#### Scenario: Movement does not exist

- WHEN PATCH /api/movements/NONEXISTENT with body `{ "description": "X" }`
- THEN the response status is 404

#### Scenario: Movement belongs to another user (ownership isolation)

- GIVEN user B has movement `M2`
- WHEN PATCH /api/movements/M2 with user A's auth session and body `{ "description": "X" }`
- THEN the response status is 404

#### Scenario: Auth required

- WHEN PATCH /api/movements/M1 without auth
- THEN the response status is 401

#### Scenario: Update date field

- WHEN PATCH /api/movements/M1 with body `{ "date": "2026-06-15" }`
- THEN `response.data.date` reflects the new date
- AND the response status is 200

#### Scenario: Update categoryId

- WHEN PATCH /api/movements/M1 with body `{ "categoryId": "<other-valid-category-id>" }`
- THEN `response.data.categoryId` is the new value
- AND `response.data.category` reflects the new category

#### Scenario: Empty body (no fields to update)

- WHEN PATCH /api/movements/M1 with body `{}`
- THEN the response status is 200
- AND the movement is unchanged (schema allows all-optional body)

---

### Requirement: DELETE /api/movements/[id] — Delete a movement

The system MUST hard-delete a movement if it exists and belongs to the authenticated user.

#### Scenario: Delete own movement

- GIVEN user A has movement `M1`
- WHEN DELETE /api/movements/M1 with user A's auth session
- THEN the response status is 200
- AND `response.data` is `{ deleted: true }`
- AND the movement no longer exists in the database

#### Scenario: Movement does not exist

- WHEN DELETE /api/movements/NONEXISTENT with any authenticated user
- THEN the response status is 404

#### Scenario: Movement belongs to another user (ownership isolation)

- GIVEN user B has movement `M2`
- WHEN DELETE /api/movements/M2 with user A's auth session
- THEN the response status is 404
- AND user B's movement `M2` still exists in the database (not deleted)

#### Scenario: Auth required

- WHEN DELETE /api/movements/M1 without auth
- THEN the response status is 401

---

### Requirement: GET /api/categories — List categories for authenticated user

The system MUST return all categories owned by the authenticated user, ordered by name ascending.

#### Scenario: List user's categories

- GIVEN user A has categories "Alimentos", "Transporte", "Salud"
- WHEN GET /api/categories with user A's auth session
- THEN the response status is 200
- AND `response.data` is an array of 3 items
- AND items are ordered alphabetically by `name`: "Alimentos", "Salud", "Transporte"
- AND each item has fields: `id`, `name`, `color`, `icon`, `type`, `userId`

#### Scenario: Empty categories list

- GIVEN user A has no categories
- WHEN GET /api/categories with user A's auth session
- THEN the response status is 200
- AND `response.data` is an empty array `[]`

#### Scenario: User isolation — only own categories

- GIVEN user A has 2 categories and user B has 3 categories
- WHEN GET /api/categories with user A's auth session
- THEN `response.data` contains exactly 2 items
- AND all items have `userId` matching user A's id

#### Scenario: Auth required

- WHEN GET /api/categories without auth
- THEN the response status is 401

---

### Requirement: POST /api/categories — Create a category

The system MUST create a new category for the authenticated user, applying validation, defaulting `color` to `#6366f1` when not provided, and rejecting duplicate names with 409.

#### Scenario: Create a valid category with all fields

- WHEN POST /api/categories with body:
  ```json
  { "name": "Entretenimiento", "type": "EGRESO", "color": "#ff5722", "icon": "🎬" }
  ```
- THEN the response status is 201
- AND `response.data.name` is `"Entretenimiento"`
- AND `response.data.type` is `"EGRESO"`
- AND `response.data.color` is `"#ff5722"`
- AND `response.data.icon` is `"🎬"`
- AND `response.data.userId` matches the auth session user id

#### Scenario: Create category with minimum fields — default color applied

- WHEN POST /api/categories with body `{ "name": "Salud", "type": "EGRESO" }`
- THEN the response status is 201
- AND `response.data.color` is `"#6366f1"` (the default)
- AND `response.data.icon` is `null`

#### Scenario: Duplicate name — same user (409)

- GIVEN user A already has a category named "Alimentos"
- WHEN POST /api/categories with body `{ "name": "Alimentos", "type": "EGRESO" }` for user A
- THEN the response status is 409
- AND `response.error` is `"A category with this name already exists"`

#### Scenario: Same name, different user — allowed

- GIVEN user A has a category named "Alimentos"
- WHEN POST /api/categories with body `{ "name": "Alimentos", "type": "EGRESO" }` for user B
- THEN the response status is 201
- AND `response.data.name` is `"Alimentos"`
- NOTE: The unique constraint is `@@unique([userId, name])`, so same name is allowed for different users.

#### Scenario: Validation — missing name

- WHEN POST /api/categories with body `{ "type": "EGRESO" }`
- THEN the response status is 400

#### Scenario: Validation — empty name

- WHEN POST /api/categories with body `{ "name": "", "type": "EGRESO" }`
- THEN the response status is 400

#### Scenario: Validation — invalid type

- WHEN POST /api/categories with body `{ "name": "X", "type": "INVALID" }`
- THEN the response status is 400

#### Scenario: Auth required

- WHEN POST /api/categories without auth
- THEN the response status is 401

---

### Requirement: PATCH /api/categories/[id] — Update a category

The system MUST partially update a category if it exists and belongs to the authenticated user, rejecting duplicate name conflicts within the same user (409) and returning 404 for non-owned or non-existent categories.

#### Scenario: Update name only

- GIVEN user A has category `C1` with name "Alimentos"
- WHEN PATCH /api/categories/C1 with body `{ "name": "Comida" }`
- THEN the response status is 200
- AND `response.data.name` is `"Comida"`
- AND all other fields remain unchanged

#### Scenario: Update color only

- WHEN PATCH /api/categories/C1 with body `{ "color": "#00ff00" }`
- THEN `response.data.color` is `"#00ff00"`

#### Scenario: Rename to an existing name — same user (409)

- GIVEN user A has categories "Alimentos" (C1) and "Transporte" (C2)
- WHEN PATCH /api/categories/C1 with body `{ "name": "Transporte" }`
- THEN the response status is 409
- AND `response.error` is `"A category with this name already exists"`

#### Scenario: Rename to same name — no-op (not a duplicate check)

- GIVEN user A has category "Alimentos" (C1)
- WHEN PATCH /api/categories/C1 with body `{ "name": "Alimentos" }`
- THEN the response status is 200
- AND the category is unchanged

#### Scenario: Update icon to null (clear icon)

- GIVEN user A has category `C1` with icon "🏠"
- WHEN PATCH /api/categories/C1 with body `{ "icon": null }`
- THEN `response.data.icon` is `null`

#### Scenario: Category does not exist

- WHEN PATCH /api/categories/NONEXISTENT with body `{ "name": "X" }`
- THEN the response status is 404

#### Scenario: Category belongs to another user (ownership isolation)

- GIVEN user B has category `C2`
- WHEN PATCH /api/categories/C2 with user A's auth session and body `{ "name": "X" }`
- THEN the response status is 404

#### Scenario: Validation — empty name

- WHEN PATCH /api/categories/C1 with body `{ "name": "" }`
- THEN the response status is 400

#### Scenario: Auth required

- WHEN PATCH /api/categories/C1 without auth
- THEN the response status is 401

---

### Requirement: DELETE /api/categories/[id] — Delete a category

The system MUST delete a category if it exists, belongs to the authenticated user, and has zero associated movements. If the category has movements, it MUST reject the deletion with 409.

#### Scenario: Delete empty category

- GIVEN user A has category `C1` with no movements
- WHEN DELETE /api/categories/C1 with user A's auth session
- THEN the response status is 200
- AND `response.data` is `{ deleted: true }`
- AND the category no longer exists in the database

#### Scenario: Category has movements — reject with 409

- GIVEN user A has category `C1` with 3 associated movements
- WHEN DELETE /api/categories/C1
- THEN the response status is 409
- AND `response.error` contains `"Cannot delete"` and `"3 movement(s)"`
- AND the category still exists in the database

#### Scenario: Category has movements — message includes exact count

- GIVEN user A has category `C1` with exactly 1 movement
- WHEN DELETE /api/categories/C1
- THEN the response status is 409
- AND `response.error` includes `"1 movement(s)"`

#### Scenario: Category does not exist

- WHEN DELETE /api/categories/NONEXISTENT
- THEN the response status is 404

#### Scenario: Category belongs to another user (ownership isolation)

- GIVEN user B has category `C2` with no movements
- WHEN DELETE /api/categories/C2 with user A's auth session
- THEN the response status is 404
- AND user B's category `C2` still exists in the database

#### Scenario: Auth required

- WHEN DELETE /api/categories/C1 without auth
- THEN the response status is 401

---

### Requirement: GET /api/summary — Monthly financial summary

The system MUST return a financial summary for the authenticated user including monthly totals, balance, per-category breakdown with percentages, and a 6-month trend. It MUST default to the current month/year when no query params are provided.

#### Scenario: Default — current month with no params

- GIVEN user A has movements in the current month:
  - 2 INGRESO movements: $1000 and $500
  - 3 EGRESO movements: $200, $300, $100
- WHEN GET /api/summary with no query params
- THEN the response status is 200
- AND `response.data.totalIngresos` is 1500
- AND `response.data.totalEgresos` is 600
- AND `response.data.balance` is 900
- AND `response.data.totalMovements` is 5
- AND `response.data.month` and `response.data.year` match the current month/year

#### Scenario: Explicit month and year

- WHEN GET /api/summary?month=3&year=2026
- THEN `response.data.month` is 3
- AND `response.data.year` is 2026
- AND only movements from March 2026 are included in totals

#### Scenario: Empty month — zero movements

- GIVEN user A has no movements in April 2026
- WHEN GET /api/summary?month=4&year=2026
- THEN the response status is 200
- AND `response.data.totalIngresos` is 0
- AND `response.data.totalEgresos` is 0
- AND `response.data.balance` is 0
- AND `response.data.byCategory` is an empty array `[]`
- AND `response.data.totalMovements` is 0

#### Scenario: Category breakdown with percentages

- GIVEN user A has in the selected month:
  - EGRESO $500 in category "Alimentos" (C1)
  - EGRESO $300 in category "Alimentos" (C1)
  - EGRESO $200 in category "Transporte" (C2)
- WHEN GET /api/summary
- THEN `response.data.byCategory` has 2 entries
- AND the "Alimentos" entry has `total: 800`, `count: 2`, `percentage: 80`
- AND the "Transporte" entry has `total: 200`, `count: 1`, `percentage: 20`
- AND each entry includes `categoryId`, `name`, and `color`

#### Scenario: Category breakdown — percentage is 0 when totalEgresos is 0

- GIVEN user A has only INGRESO movements (no EGRESOS) in the selected month
- WHEN GET /api/summary
- THEN `response.data.totalEgresos` is 0
- AND all `byCategory` entries have `percentage: 0`

#### Scenario: Monthly trend — last 6 months

- GIVEN user A has movements spread across 8 months, including the selected month
- WHEN GET /api/summary?month=6&year=2026
- THEN `response.data.monthlyTrend` is an array of exactly 6 entries
- AND entries cover January 2026 through June 2026 (format `"YYYY-MM"`)
- AND each entry has `ingresos`, `egresos`, and `month` fields

#### Scenario: Monthly trend — spans across year boundary

- WHEN GET /api/summary?month=2&year=2026
- THEN `response.data.monthlyTrend` includes months from 2025 (e.g., `"2025-09"` through `"2026-02"`)

#### Scenario: User isolation — only own movements summarized

- GIVEN user A has EGRESO $1000 and user B has EGRESO $5000 in the same month
- WHEN GET /api/summary with user A's auth session
- THEN `response.data.totalEgresos` is 1000 (not 6000)

#### Scenario: Auth required

- WHEN GET /api/summary without auth
- THEN the response status is 401

#### Scenario: Missing optional params — defaults applied

- WHEN GET /api/summary?year=2026 (no month param)
- THEN `response.data.month` is the current month (default from `new Date().getMonth() + 1`)

#### Scenario: Response shape completeness

- WHEN GET /api/summary is called with valid auth
- THEN the response body contains exactly these top-level keys inside `data`:
  `month`, `year`, `totalIngresos`, `totalEgresos`, `balance`, `byCategory`, `monthlyTrend`, `totalMovements`

---

### Requirement: Test infrastructure — Docker PostgreSQL and Prisma setup

The test suite MUST provision a disposable PostgreSQL database via Docker Compose and apply schema migrations before running any tests, and it MUST clean tables between test files to ensure isolation.

#### Scenario: Docker container is running before tests execute

- GIVEN Docker is installed
- WHEN `npm test` is invoked
- THEN a PostgreSQL container is running (or already running) on the port specified in `TEST_DATABASE_URL`
- AND Prisma migrations have been applied (all tables exist: `users`, `categories`, `movements`)
- AND tests connect to the test database, not the development/production database

#### Scenario: Table cleanup between test files

- GIVEN Test file A inserts 5 movements into the test database
- WHEN Test file A completes
- THEN before Test file B starts, the `movements`, `categories`, and `users` tables are empty
- NOTE: Cleanup is performed via a truncation helper that deletes in correct FK order (`movements` → `categories` → `users`)

#### Scenario: Test database uses same PostgreSQL major version as production

- GIVEN the project uses PostgreSQL for production
- WHEN the Docker Compose test service starts
- THEN the PostgreSQL container image matches the production major version (16.x)

---

### Requirement: Auth mocking — Isolated test user session

The test suite MUST mock `@/lib/auth` at the module level so every route handler receives a known test user session without creating real NextAuth JWTs or database users.

#### Scenario: Default auth mock provides a valid session

- GIVEN the auth mock is set up with a test user
- WHEN any route handler calls `await auth()`
- THEN the returned session has `user.id`, `user.name`, and `user.email`

#### Scenario: Auth mock can be overridden per test for 401 scenarios

- GIVEN a test overrides the auth mock to return `null`
- WHEN the route handler calls `await auth()`
- THEN the session is `null`
- AND the handler returns 401

#### Scenario: Auth mock supports different user IDs for ownership tests

- GIVEN the auth mock is configured with userId `"user-b"`
- WHEN a route handler queries the database
- THEN only resources owned by `"user-b"` are returned/accessible

---

### Requirement: Test file organization — Co-located `__tests__` directories

The test suite MUST follow the co-located `__tests__` directory convention with one test file per route group.

#### Scenario: Test file location matches source

- GIVEN the route handler is at `src/app/api/movements/route.ts`
- THEN its tests are at `src/app/api/movements/__tests__/route.test.ts`

#### Scenario: Dynamic route tests

- GIVEN the route handler is at `src/app/api/movements/[id]/route.ts`
- THEN its tests are at `src/app/api/movements/__tests__/[id].test.ts`

#### Scenario: Shared helpers are in a dedicated directory

- GIVEN the project needs test infrastructure
- THEN there is a `src/__tests__/helpers/` directory containing at minimum:
  - `setup.ts` — Vitest global setup
  - `db.ts` — test Prisma client + table truncation
  - `auth-mock.ts` — reusable auth mock factory
  - `request.ts` — `NextRequest` construction helper

---

### Requirement: Coverage reporting

The test suite MUST produce coverage reports across the `src/app/api/` directory with line coverage ≥ 80% and branch coverage ≥ 75%.

#### Scenario: Coverage report is generated

- WHEN `npm run test:coverage` is executed
- THEN a coverage report is generated in a machine-readable format (JSON/HTML)
- AND the report covers all files under `src/app/api/`

#### Scenario: Line coverage meets threshold

- WHEN the full test suite passes
- THEN line coverage for `src/app/api/` is ≥ 80%

#### Scenario: Branch coverage meets threshold

- WHEN the full test suite passes
- THEN branch coverage for `src/app/api/` is ≥ 75%

#### Scenario: Coverage is informational only — no hard CI gate

- GIVEN coverage is below the target threshold
- WHEN tests run in CI
- THEN the CI job does NOT fail due to coverage
- NOTE: Coverage is reported. A hard-fail gate is deferred to a follow-up change.

---

### Requirement: Vitest configuration

The test suite MUST use a `vitest.config.ts` at the project root configured for Node environment with path alias resolution and the v8 coverage provider.

#### Scenario: Vitest resolves `@/*` path aliases

- GIVEN a test file imports from `@/lib/api-response`
- WHEN Vitest runs the test
- THEN the import resolves to `src/lib/api-response.ts`

#### Scenario: Tests run in Node environment

- GIVEN a test file references `window` (a browser-only API)
- WHEN Vitest runs the test
- THEN `window` is `undefined` (Node environment, not jsdom)

#### Scenario: Test files match the configured pattern

- WHEN `npx vitest run` is executed
- THEN only files matching `**/__tests__/**/*.test.{ts,tsx}` are discovered and executed

#### Scenario: `npm test` runs the full suite

- WHEN `npm test` is executed from the project root
- THEN Vitest runs all discovered test files and exits
- AND the exit code is 0 when all tests pass

---

### Requirement: Request helper — `NextRequest` construction

The test suite MUST include a helper that constructs `NextRequest` objects matching the shape route handlers expect, including URL query parameters and JSON bodies.

#### Scenario: GET request with query parameters

- GIVEN a helper function `createRequest({ method: "GET", query: { type: "EGRESO", page: "2" } })`
- THEN the returned `NextRequest` has `req.url` containing `?type=EGRESO&page=2`
- AND `req.method` is `"GET"`

#### Scenario: POST request with JSON body

- GIVEN a helper function `createRequest({ method: "POST", body: { description: "Test" } })`
- THEN `await req.json()` returns `{ description: "Test" }`
- AND `req.method` is `"POST"`

#### Scenario: Dynamic route params for [id] handlers

- GIVEN a helper function `createRequest({ method: "GET" })` with params `{ params: Promise.resolve({ id: "M1" }) }`
- THEN the route handler receives `params.id` as `"M1"`
- NOTE: The helper MUST construct the params as a Promise since Next.js App Router passes `params` as `Promise<{ id: string }>` in the test target.

---

### Requirement: Database truncation helper — isolated tests

The test suite MUST provide a table truncation helper that deletes all rows in FK-safe order between test files to keep tests isolated without requiring schema recreation.

#### Scenario: Truncation clears all tables

- GIVEN the test database has rows in `movements`, `categories`, and `users`
- WHEN the truncation helper is called
- THEN all three tables are empty (0 rows each)

#### Scenario: Truncation respects FK order

- GIVEN `movements` has FK references to `categories` and `users`
- WHEN the truncation helper is called
- THEN it deletes `movements` first, then `categories`, then `users` (no FK violation errors)
