import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { success, error, unauthorized } from "@/lib/api-response";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

    const userId = session.user.id;

    // Date range for the selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Get movements in range
    const movements = await prisma.movement.findMany({
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
      },
      include: { category: true },
    });

    // Calculate totals
    const totalIngresos = movements
      .filter((m) => m.type === "INGRESO")
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const totalEgresos = movements
      .filter((m) => m.type === "EGRESO")
      .reduce((sum, m) => sum + Number(m.amount), 0);

    // By category
    const byCategoryMap = new Map<string, { name: string; color: string; total: number; count: number }>();
    for (const m of movements) {
      const key = m.categoryId;
      const existing = byCategoryMap.get(key) || {
        name: m.category.name,
        color: m.category.color,
        total: 0,
        count: 0,
      };
      existing.total += Number(m.amount);
      existing.count += 1;
      byCategoryMap.set(key, existing);
    }

    const byCategory = Array.from(byCategoryMap.entries()).map(([id, data]) => ({
      categoryId: id,
      ...data,
      percentage: totalEgresos > 0 ? Math.round((data.total / totalEgresos) * 100) : 0,
    }));

    // Monthly trend: last 6 months
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const ms = await prisma.movement.findMany({
        where: {
          userId,
          date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) },
        },
      });
      trendData.push({
        month: `${y}-${String(m).padStart(2, "0")}`,
        ingresos: ms.filter((x) => x.type === "INGRESO").reduce((s, x) => s + Number(x.amount), 0),
        egresos: ms.filter((x) => x.type === "EGRESO").reduce((s, x) => s + Number(x.amount), 0),
      });
    }

    return success({
      month,
      year,
      totalIngresos,
      totalEgresos,
      balance: totalIngresos - totalEgresos,
      byCategory,
      monthlyTrend: trendData,
      totalMovements: movements.length,
    });
  } catch (e) {
    console.error("[SUMMARY_GET]", e);
    return error("Failed to fetch summary", 500);
  }
}
