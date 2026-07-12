/**
 * Integration tests for GET /api/categories and POST /api/categories.
 *
 * Covers 12 scenarios:
 *   GET (4): list user's categories (alpha order), empty list,
 *            user isolation, auth required (401)
 *   POST (8): create with all fields, create with minimum (default color),
 *             duplicate name same user (409), same name different user (allowed),
 *             missing name (400), empty name (400), invalid type (400),
 *             auth required (401)
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { createSession, createSessionForUser } from "@/__tests__/helpers/auth-mock";
import { prisma, truncateAll } from "@/__tests__/helpers/db";
import { createRequest } from "@/__tests__/helpers/request";
import { GET, POST } from "../route";

const USER_A = "test-user-1";
const USER_B = "other-user-x";

// ────────────────────────────────────────────────────────────────────

describe("GET /api/categories", () => {
  beforeEach(async () => {
    await truncateAll();
    await prisma.user.createMany({
      data: [
        { id: USER_A, email: "a@test.com" },
        { id: USER_B, email: "b@test.com" },
      ],
    });
    vi.mocked(auth).mockResolvedValue(createSession({ id: USER_A }));
  });

  it("lists user's categories in alphabetical order", async () => {
    await prisma.category.createMany({
      data: [
        { id: "c3", name: "Transporte", userId: USER_A, color: "#111" },
        { id: "c1", name: "Alimentos", userId: USER_A, color: "#222" },
        { id: "c2", name: "Salud", userId: USER_A, color: "#333" },
      ],
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(3);
    expect(body.data[0].name).toBe("Alimentos");
    expect(body.data[1].name).toBe("Salud");
    expect(body.data[2].name).toBe("Transporte");

    for (const cat of body.data) {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("color");
      expect(cat).toHaveProperty("icon");
      expect(cat).toHaveProperty("type");
      expect(cat).toHaveProperty("userId");
    }
  });

  it("returns empty array when user has no categories", async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("returns only own categories (user isolation)", async () => {
    await prisma.category.createMany({
      data: [
        { id: "c-a1", name: "Cat A1", userId: USER_A },
        { id: "c-a2", name: "Cat A2", userId: USER_A },
        { id: "c-b1", name: "Cat B1", userId: USER_B },
        { id: "c-b2", name: "Cat B2", userId: USER_B },
        { id: "c-b3", name: "Cat B3", userId: USER_B },
      ],
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    for (const cat of body.data) {
      expect(cat.userId).toBe(USER_A);
    }
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Authentication required");
  });
});

// ════════════════════════════════════════════════════════════════════

describe("POST /api/categories", () => {
  beforeEach(async () => {
    await truncateAll();
    await prisma.user.createMany({
      data: [
        { id: USER_A, email: "a@test.com" },
        { id: USER_B, email: "b@test.com" },
      ],
    });
    vi.mocked(auth).mockResolvedValue(createSession({ id: USER_A }));
  });

  it("creates a category with all fields", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/categories",
      body: { name: "Entretenimiento", type: "EGRESO", color: "#ff5722", icon: "🎬" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.name).toBe("Entretenimiento");
    expect(body.data.type).toBe("EGRESO");
    expect(body.data.color).toBe("#ff5722");
    expect(body.data.icon).toBe("🎬");
    expect(body.data.userId).toBe(USER_A);
  });

  it("applies default color #6366f1 when color not provided", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/categories",
      body: { name: "Salud", type: "EGRESO" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.color).toBe("#6366f1");
    expect(body.data.icon).toBeNull();
  });

  it("returns 409 when name already exists for the same user", async () => {
    await prisma.category.create({
      data: { id: "existing", name: "Alimentos", userId: USER_A },
    });

    const req = createRequest({
      method: "POST",
      path: "/api/categories",
      body: { name: "Alimentos", type: "EGRESO" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("A category with this name already exists");
  });

  it("allows same name for a different user", async () => {
    // User A already has "Alimentos"
    await prisma.category.create({
      data: { id: "a-cat", name: "Alimentos", userId: USER_A },
    });
    // Switch auth to User B
    vi.mocked(auth).mockResolvedValue(createSessionForUser(USER_B));

    const req = createRequest({
      method: "POST",
      path: "/api/categories",
      body: { name: "Alimentos", type: "EGRESO" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.name).toBe("Alimentos");
    expect(body.data.userId).toBe(USER_B);
  });

  it("returns 400 when name is missing", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/categories",
      body: { type: "EGRESO" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 when name is empty", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/categories",
      body: { name: "", type: "EGRESO" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 when type is invalid", async () => {
    const req = createRequest({
      method: "POST",
      path: "/api/categories",
      body: { name: "X", type: "INVALID" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = createRequest({
      method: "POST",
      path: "/api/categories",
      body: { name: "X", type: "EGRESO" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
  });
});
