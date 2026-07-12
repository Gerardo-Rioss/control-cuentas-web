"use client";

import { useState, useEffect, useCallback } from "react";
import { MonthCard } from "@/components/dashboard/month-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet } from "lucide-react";

interface MonthSummary {
  month: string;
  ingresos: number;
  egresos: number;
  count: number;
}

export default function DashboardPage() {
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const fetchMonths = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/months");
      if (res.ok) {
        const data = await res.json();
        setMonths(data.data?.months ?? []);
      }
    } catch (e) {
      console.error("Failed to fetch months", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonths(true);
  }, [fetchMonths]);

  function toggleMonth(month: string) {
    setExpandedMonth((prev) => (prev === month ? null : month));
  }

  async function handleDeleteMonth(month: string) {
    const [year, m] = month.split("-");
    const res = await fetch(
      `/api/movements?year=${year}&month=${m}&limit=1000`,
    );
    if (!res.ok) return;
    const data = await res.json();
    const movs = data.data?.movements ?? [];
    for (const mov of movs) {
      await fetch(`/api/movements/${mov.id}`, { method: "DELETE" });
    }
    setExpandedMonth(null);
    fetchMonths(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Control de gastos e ingresos
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && months.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Sin movimientos</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Todavía no cargaste ningún movimiento. Cuando agregues tu primer
            ingreso o gasto, va a aparecer acá.
          </p>
        </div>
      )}

      {!loading && months.length > 0 && (
        <div className="space-y-4">
          {months.map((m) => (
            <MonthCard
              key={m.month}
              summary={m}
              expanded={expandedMonth === m.month}
              onToggle={() => toggleMonth(m.month)}
              onDelete={() => handleDeleteMonth(m.month)}
              onDataChanged={() => fetchMonths(false)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
