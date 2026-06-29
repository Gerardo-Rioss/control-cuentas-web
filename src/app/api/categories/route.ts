import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { success, error, unauthorized } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["EGRESO", "INGRESO"]),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    });

    return success(categories);
  } catch (e) {
    console.error("[CATEGORIES_GET]", e);
    return error("Failed to fetch categories", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten());
    }

    const existing = await prisma.category.findUnique({
      where: { userId_name: { userId: session.user.id, name: parsed.data.name } },
    });
    if (existing) {
      return error("A category with this name already exists", 409);
    }

    const category = await prisma.category.create({
      data: {
        ...parsed.data,
        color: parsed.data.color ?? "#6366f1",
        userId: session.user.id,
      },
    });

    return success(category, 201);
  } catch (e) {
    console.error("[CATEGORIES_POST]", e);
    return error("Failed to create category", 500);
  }
}
