import { prisma } from "@/lib/prisma";
import { success, error, unauthorized } from "@/lib/api-response";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    // Get all movements for the user, grouped by year-month
    const movements = await prisma.movement.findMany({
      where: { userId: session.user.id },
      select: { type: true, amount: true, date: true },
      orderBy: { date: "desc" },
    });

    // Aggregate by month
    const monthMap = new Map<
      string,
      { month: string; ingresos: number; egresos: number; count: number }
    >();

    for (const m of movements) {
      const date = new Date(m.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const existing = monthMap.get(key) ?? {
        month: key,
        ingresos: 0,
        egresos: 0,
        count: 0,
      };

      if (m.type === "INGRESO") {
        existing.ingresos += Number(m.amount);
      } else {
        existing.egresos += Number(m.amount);
      }
      existing.count += 1;

      monthMap.set(key, existing);
    }

    const months = Array.from(monthMap.values()).sort((a, b) =>
      b.month.localeCompare(a.month),
    );

    return success({ months });
  } catch (e) {
    console.error("[MONTHS_GET]", e);
    return error("Failed to fetch months", 500);
  }
}
