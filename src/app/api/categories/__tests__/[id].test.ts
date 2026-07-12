/**
 * Integration tests for PATCH /api/categories/[id] and DELETE /api/categories/[id].
 *
 * Covers 15 scenarios:
 *   PATCH (9): update name only, update color only, rename to existing name (409),
 *              rename to same name (no-op), update icon to null, nonexistent (404),
 *              other user's (404), empty name (400), auth required (401)
 *   DELETE (6): delete empty category, category with 3 movements (409 + count),
 *               category with 1 movement (409 + "1 movement(s)"), nonexistent (404),
 *               other user's (404 + verify), auth required (401)
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { createSession } from "@/__tests__/helpers/auth-mock";
import { prisma, truncateAll } from "@/__tests__/helpers/db";
import { createRequest, createParams } from "@/__tests__/helpers/request";
import { PATCH, DELETE } from "../route";

const USER_A = "test-user-1";
const USER_B = "other-user-x";

async function seedUsers() {
  await prisma.user.createMany({
    data: [
      { id: USER_A, email: "a@test.com" },
      { id: USER_B, email: "b@test.com" },
    ],
  });
}

// ────────────────────────────────────────────────────────────────────

describe("PATCH /api/categories/[id]", () => {
  beforeEach(async () => {
    await truncateAll();
    await seedUsers();
    vi.mocked(auth).mockResolvedValue(createSession({ id: USER_A }));
  });

  it("updates name only", async () => {
    const cat = await prisma.category.create({
      data: { id: "c1", name: "Alimentos", userId: USER_A, color: "#111", icon: "🍕" },
    });

    const req = createRequest({
      method: "PATCH",
      path: "/api/categories",
      body: { name: "Comida" },
    });
    const res = await PATCH(req, createParams({ id: cat.id }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.name).toBe("Comida");
    expect(body.data.color).toBe("#111"); // unchanged
    expect(body.data.icon).toBe("🍕"); // unchanged
  });

  it("updates color only", async () => {
    const cat = await prisma.category.create({
      data: { id: "c1", name: "Alimentos", userId: USER_A },
    });

    const req = createRequest({
      method: "PATCH",
      path: "/api/categories",
      body: { color: "#00ff00" },
    });
    const res = await PATCH(req, createParams({ id: cat.id }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.color).toBe("#00ff00");
  });

  it("returns 409 when renaming to an existing name for same user", async () => {
    await prisma.category.createMany({
      data: [
        { id: "c1", name: "Alimentos", userId: USER_A },
        { id: "c2", name: "Transporte", userId: USER_A },
      ],
    });

    const req = createRequest({
      method: "PATCH",
      path: "/api/categories",
      body: { name: "Transporte" },
    });
    const res = await PATCH(req, createParams({ id: "c1" }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("A category with this name already exists");
  });

  it("allows renaming to the same name (no-op)", async () => {
    const cat = await prisma.category.create({
      data: { id: "c1", name: "Alimentos", userId: USER_A },
    });

    const req = createRequest({
      method: "PATCH",
      path: "/api/categories",
      body: { name: "Alimentos" },
    });
    const res = await PATCH(req, createParams({ id: cat.id }));

    expect(res.status).toBe(200);
  });

  it("updates icon to null (clears icon)", async () => {
    const cat = await prisma.category.create({
      data: { id: "c1", name: "Casa", userId: USER_A, icon: "🏠" },
    });

    const req = createRequest({
      method: "PATCH",
      path: "/api/categories",
      body: { icon: null },
    });
    const res = await PATCH(req, createParams({ id: cat.id }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.icon).toBeNull();
  });

  it("returns 404 for nonexistent category", async () => {
    const req = createRequest({
      method: "PATCH",
      path: "/api/categories",
      body: { name: "X" },
    });
    const res = await PATCH(req, createParams({ id: "NONEXISTENT" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Category not found");
  });

  it("returns 404 for another user's category", async () => {
    await prisma.category.create({
      data: { id: "c-b", name: "User B Cat", userId: USER_B },
    });

    const req = createRequest({
      method: "PATCH",
      path: "/api/categories",
      body: { name: "X" },
    });
    const res = await PATCH(req, createParams({ id: "c-b" }));
    const body = await res.json();

    expect(res.status).toBe(404);
  });

  it("returns 400 when name is empty", async () => {
    const cat = await prisma.category.create({
      data: { id: "c1", name: "Alimentos", userId: USER_A },
    });

    const req = createRequest({
      method: "PATCH",
      path: "/api/categories",
      body: { name: "" },
    });
    const res = await PATCH(req, createParams({ id: cat.id }));

    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = createRequest({
      method: "PATCH",
      path: "/api/categories",
      body: { name: "X" },
    });
    const res = await PATCH(req, createParams({ id: "c1" }));

    expect(res.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════

describe("DELETE /api/categories/[id]", () => {
  beforeEach(async () => {
    await truncateAll();
    await seedUsers();
    vi.mocked(auth).mockResolvedValue(createSession({ id: USER_A }));
  });

  it("deletes an empty category", async () => {
    const cat = await prisma.category.create({
      data: { id: "c1", name: "Vacía", userId: USER_A },
    });

    const req = createRequest({ method: "DELETE", path: "/api/categories" });
    const res = await DELETE(req, createParams({ id: cat.id }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ deleted: true });

    const dbCat = await prisma.category.findUnique({ where: { id: cat.id } });
    expect(dbCat).toBeNull();
  });

  it("returns 409 when category has 3 movements (includes exact count)", async () => {
    const cat = await prisma.category.create({
      data: { id: "c1", name: "Con movimientos", userId: USER_A },
    });
    await prisma.movement.createMany({
      data: [
        { id: "m1", description: "M1", amount: 10, type: "EGRESO", categoryId: cat.id, userId: USER_A, date: new Date() },
        { id: "m2", description: "M2", amount: 20, type: "EGRESO", categoryId: cat.id, userId: USER_A, date: new Date() },
        { id: "m3", description: "M3", amount: 30, type: "EGRESO", categoryId: cat.id, userId: USER_A, date: new Date() },
      ],
    });

    const req = createRequest({ method: "DELETE", path: "/api/categories" });
    const res = await DELETE(req, createParams({ id: cat.id }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toContain("Cannot delete");
    expect(body.error).toContain("3 movement(s)");

    // Category still exists
    const dbCat = await prisma.category.findUnique({ where: { id: cat.id } });
    expect(dbCat).not.toBeNull();
  });

  it("returns 409 with '1 movement(s)' for a single movement", async () => {
    const cat = await prisma.category.create({
      data: { id: "c1", name: "Un movimiento", userId: USER_A },
    });
    await prisma.movement.create({
      data: { id: "m1", description: "M1", amount: 10, type: "EGRESO", categoryId: cat.id, userId: USER_A, date: new Date() },
    });

    const req = createRequest({ method: "DELETE", path: "/api/categories" });
    const res = await DELETE(req, createParams({ id: cat.id }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toContain("1 movement(s)");
  });

  it("returns 404 for nonexistent category", async () => {
    const req = createRequest({ method: "DELETE", path: "/api/categories" });
    const res = await DELETE(req, createParams({ id: "NONEXISTENT" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Category not found");
  });

  it("returns 404 for another user's category and does NOT delete it", async () => {
    await prisma.category.create({
      data: { id: "c-b", name: "User B Cat", userId: USER_B },
    });

    const req = createRequest({ method: "DELETE", path: "/api/categories" });
    const res = await DELETE(req, createParams({ id: "c-b" }));
    const body = await res.json();

    expect(res.status).toBe(404);

    // Category still exists
    const dbCat = await prisma.category.findUnique({ where: { id: "c-b" } });
    expect(dbCat).not.toBeNull();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = createRequest({ method: "DELETE", path: "/api/categories" });
    const res = await DELETE(req, createParams({ id: "c1" }));

    expect(res.status).toBe(401);
  });
});
