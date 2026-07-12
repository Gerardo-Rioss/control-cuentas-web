/**
 * Integration tests for GET /api/movements and POST /api/movements.
 *
 * Covers 23 scenarios:
 *   GET (13): list all, filter by type, filter by month/year, free-text search,
 *             combined filters, pagination page 1, pagination page 2, empty results,
 *             invalid page param, limit clamped to max 100, auth required (null),
 *             auth required (no id), user isolation
 *   POST (10): valid create, minimum fields, missing description (400),
 *              empty description (400), amount zero (400), amount negative (400),
 *              invalid type (400), missing categoryId (400), invalid date,
 *              auth required (401)
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ── Auth mock (hoisted by vitest) ──────────────────────────────────
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { createSession, createSessionForUser } from "@/__tests__/helpers/auth-mock";
import { prisma, truncateAll } from "@/__tests__/helpers/db";
import { createRequest } from "@/__tests__/helpers/request";
import { GET, POST } from "../route";

// ── Helpers ─────────────────────────────────────────────────────────

const DEFAULT_USER_ID = "test-user-1";
const OTHER_USER_ID = "other-user-x";

async function seedUser(id: string, email: string) {
  return prisma.user.create({ data: { id, email } });
}

async function seedCategory(
  id: string,
  name: string,
  userId: string,
  type: "EGRESO" | "INGRESO" = "EGRESO",
) {
  return prisma.category.create({ data: { id, name, userId, type } });
}

async function seedMovement(data: {
  id: string;
  description: string;
  amount: number;
  type: "EGRESO" | "INGRESO";
  categoryId: string;
  userId: string;
  date?: string;
}) {
  return prisma.movement.create({
    data: {
      ...data,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });
}

// ────────────────────────────────────────────────────────────────────

describe("GET /api/movements", () => {
  let catA: { id: string };

  beforeEach(async () => {
    await truncateAll();
    await seedUser(DEFAULT_USER_ID, "test@example.com");
    await seedUser(OTHER_USER_ID, "other@example.com");
    catA = await seedCategory("cat-a", "Alimentos", DEFAULT_USER_ID, "EGRESO");

    vi.mocked(auth).mockResolvedValue(createSession({ id: DEFAULT_USER_ID }));
  });

  // ── 1. List all movements for authenticated user ────────────────
  it("lists all movements for the authenticated user", async () => {
    await prisma.movement.createMany({
      data: [
        { id: "m1", description: "Comida", amount: 100, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date("2026-07-01") },
        { id: "m2", description: "Taxi", amount: 50, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date("2026-07-02") },
        { id: "m3", description: "Sueldo", amount: 1000, type: "INGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date("2026-07-03") },
      ],
    });
    // Seed movements for another user — should NOT appear
    const catB = await seedCategory("cat-b", "Otro", OTHER_USER_ID);
    await prisma.movement.createMany({
      data: [
        { id: "m4", description: "Other1", amount: 200, type: "EGRESO", categoryId: catB.id, userId: OTHER_USER_ID, date: new Date() },
        { id: "m5", description: "Other2", amount: 300, type: "EGRESO", categoryId: catB.id, userId: OTHER_USER_ID, date: new Date() },
      ],
    });

    const req = createRequest({ method: "GET", path: "/api/movements" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.movements).toHaveLength(3);
    expect(body.data.pagination).toEqual({ page: 1, limit: 50, total: 3, totalPages: 1 });
    // Every movement must include its category
    for (const mov of body.data.movements) {
      expect(mov.category).toBeDefined();
      expect(mov.category.id).toBeDefined();
      expect(mov.category.name).toBeDefined();
      expect(mov.category.color).toBeDefined();
    }
  });

  // ── 2. Filter by type ──────────────────────────────────────────
  it("filters by type INGRESO", async () => {
    await prisma.movement.createMany({
      data: [
        { id: "m1", description: "Egreso 1", amount: 100, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date() },
        { id: "m2", description: "Egreso 2", amount: 200, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date() },
        { id: "m3", description: "Ingreso 1", amount: 500, type: "INGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date() },
      ],
    });

    const req = createRequest({ method: "GET", query: { type: "INGRESO" }, path: "/api/movements" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.movements).toHaveLength(1);
    expect(body.data.movements[0].type).toBe("INGRESO");
    expect(body.data.pagination.total).toBe(1);
  });

  // ── 3. Filter by month and year ─────────────────────────────────
  it("filters by month and year", async () => {
    await prisma.movement.createMany({
      data: [
        { id: "m1", description: "Jan 1", amount: 10, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date("2026-01-15") },
        { id: "m2", description: "Jan 2", amount: 20, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date("2026-01-20") },
        { id: "m3", description: "Feb 1", amount: 30, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date("2026-02-05") },
      ],
    });

    const req = createRequest({ method: "GET", query: { month: "1", year: "2026" }, path: "/api/movements" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.movements).toHaveLength(2);
    expect(body.data.pagination.total).toBe(2);
  });

  // ── 4. Free-text search ────────────────────────────────────────
  it("filters by free-text search (case-insensitive)", async () => {
    await prisma.movement.createMany({
      data: [
        { id: "m1", description: "Supermercado", amount: 100, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date() },
        { id: "m2", description: "SuperVea", amount: 50, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date() },
        { id: "m3", description: "Farmacia", amount: 30, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date() },
      ],
    });

    const req = createRequest({ method: "GET", query: { search: "super" }, path: "/api/movements" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.movements).toHaveLength(2);
    expect(body.data.pagination.total).toBe(2);
  });

  // ── 5. Combined filters ────────────────────────────────────────
  it("applies combined filters (type + month/year + search)", async () => {
    await prisma.movement.createMany({
      data: [
        { id: "m1", description: "Luz marzo", amount: 100, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date("2026-03-10") },
        { id: "m2", description: "Agua marzo", amount: 50, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date("2026-03-15") },
        { id: "m3", description: "Luz abril", amount: 80, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date("2026-04-01") },
        { id: "m4", description: "Luz marzo", amount: 200, type: "INGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date("2026-03-05") },
      ],
    });

    const req = createRequest({
      method: "GET",
      query: { type: "EGRESO", month: "3", year: "2026", search: "luz" },
      path: "/api/movements",
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.movements).toHaveLength(1);
    expect(body.data.movements[0].description).toBe("Luz marzo");
    expect(body.data.pagination.total).toBe(1);
  });

  // ── 6. Pagination — page 1 with limit ──────────────────────────
  it("paginates page 1 with limit 3", async () => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      id: `m${i + 1}`,
      description: `Mov ${i + 1}`,
      amount: (i + 1) * 10,
      type: "EGRESO" as const,
      categoryId: catA.id,
      userId: DEFAULT_USER_ID,
      date: new Date(2026, 6, 10 - i),
    }));
    await prisma.movement.createMany({ data });

    const req = createRequest({ method: "GET", query: { page: "1", limit: "3" }, path: "/api/movements" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.movements).toHaveLength(3);
    expect(body.data.pagination).toEqual({ page: 1, limit: 3, total: 10, totalPages: 4 });
  });

  // ── 7. Pagination — page 2 ─────────────────────────────────────
  it("paginates page 2 with limit 3", async () => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      id: `m${i + 1}`,
      description: `Mov ${i + 1}`,
      amount: (i + 1) * 10,
      type: "EGRESO" as const,
      categoryId: catA.id,
      userId: DEFAULT_USER_ID,
      date: new Date(2026, 6, 10 - i),
    }));
    await prisma.movement.createMany({ data });

    const req = createRequest({ method: "GET", query: { page: "2", limit: "3" }, path: "/api/movements" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.movements).toHaveLength(3);
    expect(body.data.pagination.page).toBe(2);
  });

  // ── 8. Empty results ───────────────────────────────────────────
  it("returns empty array when no movements match", async () => {
    const req = createRequest({ method: "GET", query: { search: "nonexistent" }, path: "/api/movements" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.movements).toEqual([]);
    expect(body.data.pagination.total).toBe(0);
    expect(body.data.pagination.totalPages).toBe(0);
  });

  // ── 9. Invalid page param ──────────────────────────────────────
  it("defaults to page 1 for invalid page param", async () => {
    const req = createRequest({ method: "GET", query: { page: "abc" }, path: "/api/movements" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.pagination.page).toBe(1);
  });

  // ── 10. Limit clamped to max 100 ───────────────────────────────
  it("clamps limit to max 100", async () => {
    const req = createRequest({ method: "GET", query: { limit: "200" }, path: "/api/movements" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.pagination.limit).toBe(100);
  });

  // ── 11. Auth required — null session ──────────────────────────
  it("returns 401 when session is null", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const req = createRequest({ method: "GET", path: "/api/movements" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Authentication required");
  });

  // ── 12. Auth required — session with no user id ───────────────
  it("returns 401 when session has no user id", async () => {
    vi.mocked(auth).mockResolvedValue({ user: {} });

    const req = createRequest({ method: "GET", path: "/api/movements" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
  });

  // ── 13. User isolation ─────────────────────────────────────────
  it("returns only the authenticated user's movements", async () => {
    const catB = await seedCategory("cat-b", "OtherCat", OTHER_USER_ID);
    await prisma.movement.createMany({
      data: [
        { id: "m1", description: "User A - M1", amount: 100, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date() },
        { id: "m2", description: "User A - M2", amount: 200, type: "EGRESO", categoryId: catA.id, userId: DEFAULT_USER_ID, date: new Date() },
        { id: "m3", description: "User B - M1", amount: 300, type: "EGRESO", categoryId: catB.id, userId: OTHER_USER_ID, date: new Date() },
        { id: "m4", description: "User B - M2", amount: 400, type: "EGRESO", categoryId: catB.id, userId: OTHER_USER_ID, date: new Date() },
        { id: "m5", description: "User B - M3", amount: 500, type: "EGRESO", categoryId: catB.id, userId: OTHER_USER_ID, date: new Date() },
      ],
    });

    const req = createRequest({ method: "GET", path: "/api/movements" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.movements).toHaveLength(2);
    for (const mov of body.data.movements) {
      expect(mov.userId).toBe(DEFAULT_USER_ID);
    }
  });
});

// ════════════════════════════════════════════════════════════════════
// POST /api/movements
// ════════════════════════════════════════════════════════════════════

describe("POST /api/movements", () => {
  let catA: { id: string };

  beforeEach(async () => {
    await truncateAll();
    await seedUser(DEFAULT_USER_ID, "test@example.com");
    catA = await seedCategory("cat-a", "Alimentos", DEFAULT_USER_ID);
    vi.mocked(auth).mockResolvedValue(createSession({ id: DEFAULT_USER_ID }));
  });

  // ── 1. Create a valid movement ─────────────────────────────────
  it("creates a movement with all fields", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/movements",
      body: {
        description: "Supermercado",
        amount: 150.5,
        type: "EGRESO",
        categoryId: catA.id,
        date: "2026-07-10",
        isPaid: false,
        notes: "Compra semanal",
      },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.description).toBe("Supermercado");
    expect(Number(body.data.amount)).toBe(150.5);
    expect(body.data.type).toBe("EGRESO");
    expect(body.data.categoryId).toBe(catA.id);
    expect(body.data.userId).toBe(DEFAULT_USER_ID);
    expect(body.data.category).toBeDefined();
    expect(body.data.isPaid).toBe(false);
    expect(body.data.notes).toBe("Compra semanal");

    // Verify in DB
    const dbMov = await prisma.movement.findUnique({ where: { id: body.data.id } });
    expect(dbMov).not.toBeNull();
  });

  // ── 2. Minimum valid body (no optionals) ──────────────────────
  it("creates a movement with only required fields", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/movements",
      body: {
        description: "Café",
        amount: 5,
        type: "EGRESO",
        categoryId: catA.id,
      },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.description).toBe("Café");
    expect(body.data.isPaid).toBe(false);
    expect(body.data.notes).toBeNull();
    // Date should default to today (just check it's a valid ISO string)
    expect(body.data.date).toBeDefined();
    expect(new Date(body.data.date).toString()).not.toBe("Invalid Date");
  });

  // ── 3. Missing description ─────────────────────────────────────
  it("returns 400 when description is missing", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/movements",
      body: { amount: 100, type: "EGRESO", categoryId: catA.id },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeDefined();
  });

  // ── 4. Empty description ──────────────────────────────────────
  it("returns 400 when description is empty", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/movements",
      body: { description: "", amount: 100, type: "EGRESO", categoryId: catA.id },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
  });

  // ── 5. Amount zero ────────────────────────────────────────────
  it("returns 400 when amount is zero", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/movements",
      body: { description: "X", amount: 0, type: "EGRESO", categoryId: catA.id },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details).toBeDefined();
  });

  // ── 6. Amount negative ────────────────────────────────────────
  it("returns 400 when amount is negative", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/movements",
      body: { description: "X", amount: -50, type: "EGRESO", categoryId: catA.id },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
  });

  // ── 7. Invalid type ───────────────────────────────────────────
  it("returns 400 when type is invalid", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/movements",
      body: { description: "X", amount: 100, type: "INVALIDO", categoryId: catA.id },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details).toBeDefined();
  });

  // ── 8. Missing categoryId ─────────────────────────────────────
  it("returns 400 when categoryId is missing", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/movements",
      body: { description: "X", amount: 100, type: "EGRESO" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
  });

  // ── 9. Invalid date (documents current behavior) ──────────────
  it("handles invalid date string (documents current behavior)", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/movements",
      body: {
        description: "Test",
        amount: 100,
        type: "EGRESO",
        categoryId: catA.id,
        date: "not-a-date",
      },
    });
    const res = await POST(req);

    // The schema does not validate date format, so the request is accepted.
    // `new Date("not-a-date")` produces `Invalid Date`, which Prisma may
    // reject or insert. We just verify the handler doesn't crash.
    // This is a known gap — date format validation should be added later.
    expect([201, 500]).toContain(res.status);
  });

  // ── 10. Auth required ─────────────────────────────────────────
  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const req = createRequest({
      method: "POST",
      path: "/api/movements",
      body: { description: "X", amount: 100, type: "EGRESO", categoryId: catA.id },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Authentication required");
  });
});
