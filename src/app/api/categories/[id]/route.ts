import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { success, error, unauthorized, notFound } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  icon: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const { id } = await params;
    const existing = await prisma.category.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFound("Category");

    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten());
    }

    // If renaming, check for duplicate
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const dup = await prisma.category.findUnique({
        where: { userId_name: { userId: session.user.id, name: parsed.data.name } },
      });
      if (dup) {
        return error("A category with this name already exists", 409);
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    return success(category);
  } catch (e) {
    console.error("[CATEGORY_PATCH]", e);
    return error("Failed to update category", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const { id } = await params;
    const existing = await prisma.category.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFound("Category");

    // Check if category has movements
    const movCount = await prisma.movement.count({
      where: { categoryId: id },
    });
    if (movCount > 0) {
      return error(`Cannot delete: ${movCount} movement(s) use this category. Reassign them first.`, 409);
    }

    await prisma.category.delete({ where: { id } });
    return success({ deleted: true });
  } catch (e) {
    console.error("[CATEGORY_DELETE]", e);
    return error("Failed to delete category", 500);
  }
}
