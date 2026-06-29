import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { success, error, unauthorized, notFound } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateMovementSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["EGRESO", "INGRESO"]).optional(),
  isPaid: z.boolean().optional(),
  date: z.string().optional(),
  notes: z.string().nullable().optional(),
  categoryId: z.string().min(1).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const { id } = await params;
    const movement = await prisma.movement.findFirst({
      where: { id, userId: session.user.id },
      include: { category: true },
    });

    if (!movement) return notFound("Movement");
    return success(movement);
  } catch (e) {
    console.error("[MOVEMENT_GET]", e);
    return error("Failed to fetch movement", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const { id } = await params;
    const existing = await prisma.movement.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFound("Movement");

    const body = await req.json();
    const parsed = updateMovementSchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten());
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (updateData.date) {
      updateData.date = new Date(updateData.date as string);
    }
    if (updateData.isPaid !== undefined) {
      updateData.paidAt = updateData.isPaid ? new Date() : null;
    }

    const movement = await prisma.movement.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return success(movement);
  } catch (e) {
    console.error("[MOVEMENT_PATCH]", e);
    return error("Failed to update movement", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const { id } = await params;
    const existing = await prisma.movement.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFound("Movement");

    await prisma.movement.delete({ where: { id } });
    return success({ deleted: true });
  } catch (e) {
    console.error("[MOVEMENT_DELETE]", e);
    return error("Failed to delete movement", 500);
  }
}
