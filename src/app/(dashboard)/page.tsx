"use client";

import { useState, useEffect, useCallback } from "react";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ExpenseTable } from "@/components/dashboard/expense-table";
import { IncomePanel } from "@/components/dashboard/income-panel";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { PieChart } from "@/components/dashboard/pie-chart";
import { LineChart } from "@/components/dashboard/line-chart";
import { BarChart } from "@/components/dashboard/bar-chart";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MovementDialog } from "@/components/dashboard/movement-dialog";

interface MovementData {
  id: string;
  description: string;
  amount: number;
  type: "EGRESO" | "INGRESO";
  date: string;
  isPaid: boolean;
  notes: string | null;
  category: { id: string; name: string; color: string };
  categoryId: string;
}

interface CategorySummary {
  name: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

interface TrendItem {
  month: string;
  ingresos: number;
  egresos: number;
}

interface SummaryData {
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  totalMovements: number;
  byCategory: CategorySummary[];
  monthlyTrend: TrendItem[];
}

export default function DashboardPage() {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [activeMonth, setActiveMonth] = useState(defaultMonth);
  const [movements, setMovements] = useState<MovementData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<MovementData | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [year, month] = activeMonth.split("-");
      const [movRes, sumRes] = await Promise.all([
        fetch(`/api/movements?year=${year}&month=${month}&limit=100`),
        fetch(`/api/summary?year=${year}&month=${month}`),
      ]);
      if (movRes.ok) {
        const movData = await movRes.json();
        setMovements(movData.data?.movements ?? []);
      }
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.data);
      }
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setLoading(false);
    }
  }, [activeMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute all months: last 12 months, but expandable
  const [availableMonths, setAvailableMonths] = useState<string[]>(() => {
    const monthsSet = new Set<string>();
    const now = new Date();
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    // Also include months from trend data
    if (summary?.monthlyTrend) {
      for (const t of summary.monthlyTrend) {
        monthsSet.add(t.month);
      }
    }
    return Array.from(monthsSet).sort();
  });

  // Sync availableMonths when summary loads (adds any older months)
  useEffect(() => {
    if (summary?.monthlyTrend) {
      setAvailableMonths((prev) => {
        const set = new Set(prev);
        for (const t of summary.monthlyTrend) {
          set.add(t.month);
        }
        return Array.from(set).sort();
      });
    }
  }, [summary]);

  function handleMonthChange(month: string) {
    // Ensure the month exists in the list
    setAvailableMonths((prev) => {
      if (prev.includes(month)) return prev;
      const set = new Set(prev);
      set.add(month);
      return Array.from(set).sort();
    });
    setActiveMonth(month);
  }

  // Dynamically expand months when navigating beyond current range
  function expandMonths(direction: "prev" | "next") {
    setAvailableMonths((prev) => {
      const set = new Set(prev);
      const first = new Date(prev[0] + "-01");
      const last = new Date(prev[prev.length - 1] + "-01");
      if (direction === "prev") {
        const d = new Date(first.getFullYear(), first.getMonth() - 1, 1);
        set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      } else {
        const d = new Date(last.getFullYear(), last.getMonth() + 1, 1);
        set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
      return Array.from(set).sort();
    });
  }

  async function handleTogglePaid(id: string, isPaid: boolean) {
    const res = await fetch(`/api/movements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid }),
    });
    if (res.ok) {
      setMovements((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isPaid } : m))
      );
      fetchData();
    }
  }

  async function handleSaveMovement(data: { description: string; amount: string; type: "EGRESO" | "INGRESO"; categoryId: string; isPaid: boolean; notes: string }, editId?: string) {
    const url = editId ? `/api/movements/${editId}` : "/api/movements";
    const method = editId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, amount: parseFloat(data.amount) }),
    });
    if (res.ok) {
      fetchData();
    }
  }

  async function handleDeleteMovement(id: string) {
    const res = await fetch(`/api/movements/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMovements((prev) => prev.filter((m) => m.id !== id));
      fetchData();
    }
  }

  async function handleDeleteMonth(month: string) {
    const [year, m] = month.split("-");
    // Delete all movements for that month
    const res = await fetch(`/api/movements?year=${year}&month=${m}&limit=1000`);
    if (!res.ok) return;
    const data = await res.json();
    const movs = data.data?.movements ?? [];
    for (const mov of movs) {
      await fetch(`/api/movements/${mov.id}`, { method: "DELETE" });
    }
    fetchData();
  }

  function handleEdit(movement: MovementData) {
    setEditingMovement(movement);
    setDialogOpen(true);
  }

  function handleNewMovement() {
    setEditingMovement(null);
    setDialogOpen(true);
  }

  const incomes = movements.filter((m) => m.type === "INGRESO") as any[];

  // Bar chart data: compare current month with previous
  const barChartData = summary?.monthlyTrend
    ? (() => {
        const trend = summary.monthlyTrend.filter((t) => t.ingresos > 0 || t.egresos > 0);
        const current = trend[trend.length - 1];
        const previous = trend[trend.length - 2];
        if (!current || !previous) return [];
        return [
          { name: "Ingresos", actual: current.ingresos, previous: previous.ingresos },
          { name: "Egresos", actual: current.egresos, previous: previous.egresos },
          { name: "Saldo", actual: current.ingresos - current.egresos, previous: previous.ingresos - previous.egresos },
        ];
      })()
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Control de gastos e ingresos
          </p>
        </div>
        <Button size="sm" onClick={handleNewMovement}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Movimiento
        </Button>
      </div>

      {/* Month Selector - navegación mes a mes */}
      {!loading && (
        <MonthSelector
          months={availableMonths}
          active={activeMonth}
          onChange={(month) => {
            handleMonthChange(month);
          }}
          onDeleteMonth={handleDeleteMonth}
          onExpandPrev={() => expandMonths("prev")}
          onExpandNext={() => expandMonths("next")}
        />
      )}

      {/* Summary Cards */}
      <SummaryCards data={summary} />

      {/* Charts Section */}
      {summary && summary.monthlyTrend && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gastos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={summary.byCategory} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolución Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={summary.monthlyTrend} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bar Chart */}
      {barChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparativa con Mes Anterior</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={barChartData} />
          </CardContent>
        </Card>
      )}

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Gastos</h2>
          <ExpenseTable
            movements={movements}
            onTogglePaid={handleTogglePaid}
            onEdit={handleEdit}
            onDelete={handleDeleteMovement}
            loading={loading}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3">Ingresos</h2>
          <IncomePanel
            incomes={incomes}
            onEdit={handleEdit}
            onDelete={handleDeleteMovement}
            loading={loading}
          />
        </div>
      </div>

      <MovementDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingMovement(null);
        }}
        onSave={handleSaveMovement}
        editMovement={editingMovement}
      />
    </div>
  );
}
