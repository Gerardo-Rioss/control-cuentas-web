import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { success, error, unauthorized } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createMovementSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["EGRESO", "INGRESO"]),
  date: z.string().optional(),
  isPaid: z.boolean().optional(),
  notes: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "EGRESO" | "INGRESO" | null;
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const where: Record<string, unknown> = { userId: session.user.id };

    if (type && ["EGRESO", "INGRESO"].includes(type)) where.type = type;
    if (search) where.description = { contains: search, mode: "insensitive" };

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    }

    const [movements, total] = await Promise.all([
      prisma.movement.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.movement.count({ where }),
    ]);

    return success({
      movements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("[MOVEMENTS_GET]", e);
    return error("Failed to fetch movements", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const body = await req.json();
    const parsed = createMovementSchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten());
    }

    const { date, ...rest } = parsed.data;
    const movement = await prisma.movement.create({
      data: {
        ...rest,
        date: date ? new Date(date) : new Date(),
        userId: session.user.id,
      },
      include: { category: true },
    });

    return success(movement, 201);
  } catch (e) {
    console.error("[MOVEMENTS_POST]", e);
    return error("Failed to create movement", 500);
  }
}
