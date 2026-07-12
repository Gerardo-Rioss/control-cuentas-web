/**
 * Integration tests for GET /api/movements/[id], PATCH /api/movements/[id],
 * and DELETE /api/movements/[id].
 *
 * Covers 20 scenarios:
 *   GET (4): retrieve own, nonexistent (404), other user's (404), auth required (401)
 *   PATCH (12): partial update description, update multiple fields,
 *               isPaid true → sets paidAt, isPaid false → clears paidAt,
 *               non-positive amount (400), invalid type (400), empty description (400),
 *               nonexistent (404), other user's (404), auth required (401),
 *               update date, update categoryId, empty body (no-op)
 *   DELETE (4): delete own, nonexistent (404), other user's (404 + verify),
 *               auth required (401)
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { createSession } from "@/__tests__/helpers/auth-mock";
import { prisma, truncateAll } from "@/__tests__/helpers/db";
import { createRequest, createParams } from "@/__tests__/helpers/request";
import { GET, PATCH, DELETE } from "../route";

// ── Helpers ─────────────────────────────────────────────────────────

const USER_A = "test-user-1";
const USER_B = "other-user-x";
const CAT_A = "cat-a";
const CAT_B = "cat-b";
const MOV_A = "mov-a";
const MOV_B = "mov-b";

async function seedIsolationData() {
  await truncateAll();
  await prisma.user.createMany({
    data: [
      { id: USER_A, email: "a@test.com" },
      { id: USER_B, email: "b@test.com" },
    ],
  });
  await prisma.category.createMany({
    data: [
      { id: CAT_A, name: "Food", userId: USER_A },
      { id: CAT_B, name: "OtherCat", userId: USER_B },
    ],
  });
  await prisma.movement.createMany({
    data: [
      {
        id: MOV_A,
        description: "User A movement",
        amount: 100,
        type: "EGRESO",
        categoryId: CAT_A,
        userId: USER_A,
        date: new Date("2026-07-01"),
      },
      {
        id: MOV_B,
        description: "User B movement",
        amount: 200,
        type: "EGRESO",
        categoryId: CAT_B,
        userId: USER_B,
        date: new Date("2026-07-01"),
      },
    ],
  });
}

// ────────────────────────────────────────────────────────────────────

describe("GET /api/movements/[id]", () => {
  beforeEach(async () => {
    await seedIsolationData();
    vi.mocked(auth).mockResolvedValue(createSession({ id: USER_A }));
  });

  it("retrieves own movement", async () => {
    const req = createRequest({ method: "GET", path: "/api/movements" });
    const res = await GET(req, createParams({ id: MOV_A }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe(MOV_A);
    expect(body.data.description).toBe("User A movement");
    expect(body.data.category).toBeDefined();
    expect(body.data.category.id).toBe(CAT_A);
  });

  it("returns 404 for nonexistent movement", async () => {
    const req = createRequest({ method: "GET", path: "/api/movements" });
    const res = await GET(req, createParams({ id: "NONEXISTENT" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Movement not found");
  });

  it("returns 404 for another user's movement (ownership isolation)", async () => {
    const req = createRequest({ method: "GET", path: "/api/movements" });
    const res = await GET(req, createParams({ id: MOV_B }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Movement not found");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const req = createRequest({ method: "GET", path: "/api/movements" });
    const res = await GET(req, createParams({ id: MOV_A }));
    const body = await res.json();

    expect(res.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════

describe("PATCH /api/movements/[id]", () => {
  beforeEach(async () => {
    await seedIsolationData();
    vi.mocked(auth).mockResolvedValue(createSession({ id: USER_A }));
  });

  it("partially updates description only", async () => {
    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: { description: "New name" },
    });
    const res = await PATCH(req, createParams({ id: MOV_A }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.description).toBe("New name");
    // Other fields unchanged
    expect(Number(body.data.amount)).toBe(100);
    expect(body.data.type).toBe("EGRESO");
  });

  it("updates multiple fields", async () => {
    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: { description: "Updated", amount: 200, notes: "New note" },
    });
    const res = await PATCH(req, createParams({ id: MOV_A }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.description).toBe("Updated");
    expect(Number(body.data.amount)).toBe(200);
    expect(body.data.notes).toBe("New note");
  });

  it("sets paidAt when isPaid toggled to true", async () => {
    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: { isPaid: true },
    });
    const res = await PATCH(req, createParams({ id: MOV_A }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.isPaid).toBe(true);
    expect(body.data.paidAt).toBeDefined();
    expect(new Date(body.data.paidAt).toString()).not.toBe("Invalid Date");
  });

  it("clears paidAt when isPaid toggled to false", async () => {
    // First set isPaid to true
    await prisma.movement.update({
      where: { id: MOV_A },
      data: { isPaid: true, paidAt: new Date() },
    });

    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: { isPaid: false },
    });
    const res = await PATCH(req, createParams({ id: MOV_A }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.isPaid).toBe(false);
    expect(body.data.paidAt).toBeNull();
  });

  it("returns 400 for non-positive amount", async () => {
    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: { amount: -10 },
    });
    const res = await PATCH(req, createParams({ id: MOV_A }));

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid type", async () => {
    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: { type: "FOO" },
    });
    const res = await PATCH(req, createParams({ id: MOV_A }));

    expect(res.status).toBe(400);
  });

  it("returns 400 for empty description", async () => {
    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: { description: "" },
    });
    const res = await PATCH(req, createParams({ id: MOV_A }));

    expect(res.status).toBe(400);
  });

  it("returns 404 for nonexistent movement", async () => {
    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: { description: "X" },
    });
    const res = await PATCH(req, createParams({ id: "NONEXISTENT" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Movement not found");
  });

  it("returns 404 for another user's movement", async () => {
    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: { description: "X" },
    });
    const res = await PATCH(req, createParams({ id: MOV_B }));
    const body = await res.json();

    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: { description: "X" },
    });
    const res = await PATCH(req, createParams({ id: MOV_A }));

    expect(res.status).toBe(401);
  });

  it("updates date field", async () => {
    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: { date: "2026-06-15" },
    });
    const res = await PATCH(req, createParams({ id: MOV_A }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(new Date(body.data.date).toISOString().slice(0, 10)).toBe("2026-06-15");
  });

  it("updates categoryId and includes new category", async () => {
    const newCat = await prisma.category.create({
      data: { id: "new-cat", name: "NewCat", userId: USER_A },
    });

    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: { categoryId: newCat.id },
    });
    const res = await PATCH(req, createParams({ id: MOV_A }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.categoryId).toBe(newCat.id);
    expect(body.data.category.id).toBe(newCat.id);
  });

  it("handles empty body (no-op, returns unchanged)", async () => {
    const req = createRequest({
      method: "PATCH",
      path: "/api/movements",
      body: {},
    });
    const res = await PATCH(req, createParams({ id: MOV_A }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe(MOV_A);
    expect(body.data.description).toBe("User A movement");
  });
});

// ════════════════════════════════════════════════════════════════════

describe("DELETE /api/movements/[id]", () => {
  beforeEach(async () => {
    await seedIsolationData();
    vi.mocked(auth).mockResolvedValue(createSession({ id: USER_A }));
  });

  it("deletes own movement", async () => {
    const req = createRequest({ method: "DELETE", path: "/api/movements" });
    const res = await DELETE(req, createParams({ id: MOV_A }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ deleted: true });

    // Verify it's gone from DB
    const dbMov = await prisma.movement.findUnique({ where: { id: MOV_A } });
    expect(dbMov).toBeNull();
  });

  it("returns 404 for nonexistent movement", async () => {
    const req = createRequest({ method: "DELETE", path: "/api/movements" });
    const res = await DELETE(req, createParams({ id: "NONEXISTENT" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Movement not found");
  });

  it("returns 404 for another user's movement and does NOT delete it", async () => {
    const req = createRequest({ method: "DELETE", path: "/api/movements" });
    const res = await DELETE(req, createParams({ id: MOV_B }));
    const body = await res.json();

    expect(res.status).toBe(404);

    // Verify User B's movement still exists
    const dbMov = await prisma.movement.findUnique({ where: { id: MOV_B } });
    expect(dbMov).not.toBeNull();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = createRequest({ method: "DELETE", path: "/api/movements" });
    const res = await DELETE(req, createParams({ id: MOV_A }));

    expect(res.status).toBe(401);
  });
});
