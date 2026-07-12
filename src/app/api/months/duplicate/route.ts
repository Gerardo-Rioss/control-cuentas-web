import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { success, error, unauthorized } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { z } from "zod";

const duplicateSchema = z.object({
  sourceMonth: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM"),
  targetMonth: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const body = await req.json();
    const parsed = duplicateSchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten());
    }

    const { sourceMonth, targetMonth } = parsed.data;
    const [srcYear, srcMonth] = sourceMonth.split("-").map(Number);
    const [tgtYear, tgtMonth] = targetMonth.split("-").map(Number);

    // Fetch all movements from source month
    const sourceMovements = await prisma.movement.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: new Date(srcYear, srcMonth - 1, 1),
          lt: new Date(srcYear, srcMonth, 1),
        },
      },
    });

    if (sourceMovements.length === 0) {
      return error("No movements found in source month", 404);
    }

    // Check if target month already has movements
    const existingCount = await prisma.movement.count({
      where: {
        userId: session.user.id,
        date: {
          gte: new Date(tgtYear, tgtMonth - 1, 1),
          lt: new Date(tgtYear, tgtMonth, 1),
        },
      },
    });

    if (existingCount > 0) {
      return error(
        `Target month already has ${existingCount} movement(s). Delete them first or choose a different target month.`,
        409,
      );
    }

    // Duplicate each movement, shifting the date to the target month
    const created = [];
    for (const mov of sourceMovements) {
      const srcDate = new Date(mov.date);
      const newDate = new Date(
        tgtYear,
        tgtMonth - 1,
        Math.min(srcDate.getDate(), new Date(tgtYear, tgtMonth, 0).getDate()),
      );

      const dup = await prisma.movement.create({
        data: {
          description: mov.description,
          amount: mov.amount,
          type: mov.type,
          date: newDate,
          isPaid: false, // reset paid status
          notes: mov.notes,
          categoryId: mov.categoryId,
          userId: session.user.id,
        },
        include: { category: true },
      });
      created.push(dup);
    }

    return success({
      duplicated: created.length,
      movements: created,
    });
  } catch (e) {
    console.error("[MONTHS_DUPLICATE]", e);
    return error("Failed to duplicate month", 500);
  }
}
