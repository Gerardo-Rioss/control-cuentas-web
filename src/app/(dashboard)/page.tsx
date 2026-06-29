"use client";

import { useState, useEffect, useCallback } from "react";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ExpenseTable } from "@/components/dashboard/expense-table";
import { IncomePanel } from "@/components/dashboard/income-panel";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface SummaryData {
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  totalMovements: number;
}

export default function DashboardPage() {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [activeMonth, setActiveMonth] = useState(defaultMonth);
  const [movements, setMovements] = useState<MovementData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchMovements = useCallback(async () => {
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
    fetchMovements();
  }, [fetchMovements]);

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
      // Refresh summary
      const [year, month] = activeMonth.split("-");
      const sumRes = await fetch(`/api/summary?year=${year}&month=${month}`);
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.data);
      }
    }
  }

  async function handleCreateMovement(data: { description: string; amount: string; type: "EGRESO" | "INGRESO"; categoryId: string; isPaid: boolean; notes: string }) {
    const res = await fetch("/api/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, amount: parseFloat(data.amount) }),
    });
    if (res.ok) {
      fetchMovements();
    }
  }

  const availableMonths = [
    "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05",
    "2026-06", "2026-07",
  ];

  const incomes = movements.filter((m) => m.type === "INGRESO");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Control de Cuentas</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Movimiento
        </Button>
      </div>

      <MonthSelector
        months={availableMonths}
        active={activeMonth}
        onChange={setActiveMonth}
      />

      <SummaryCards data={summary} />

      <hr className="border-t" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Gastos</h2>
          <ExpenseTable
            movements={movements}
            onTogglePaid={handleTogglePaid}
            loading={loading}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3">Ingresos</h2>
          <IncomePanel incomes={incomes} loading={loading} />
        </div>
      </div>

      <MovementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleCreateMovement}
      />
    </div>
  );
}
