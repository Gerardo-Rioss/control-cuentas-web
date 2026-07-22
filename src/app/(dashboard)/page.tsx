"use client";

import { useState, useEffect, useCallback } from "react";
import { MonthCard } from "@/components/dashboard/month-card";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet } from "lucide-react";

interface MonthSummary {
  month: string;
  ingresos: number;
  egresos: number;
  count: number;
}

interface SummaryData {
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  totalMovements: number;
  monthlyTrend?: Array<{ month: string; ingresos: number; egresos: number }>;
}

export default function DashboardPage() {
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Buenos días");
    else if (hour < 18) setGreeting("Buenas tardes");
    else setGreeting("Buenas noches");
  }, []);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

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

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch(
        `/api/summary?year=${currentYear}&month=${currentMonth}`
      );
      if (res.ok) {
        const data = await res.json();
        setSummary(data.data ?? null);
      }
    } catch (e) {
      console.error("Failed to fetch summary", e);
    } finally {
      setSummaryLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchMonths(true);
    fetchSummary();
  }, [fetchMonths, fetchSummary]);

  function toggleMonth(month: string) {
    setExpandedMonth((prev) => (prev === month ? null : month));
  }

  async function handleDeleteMonth(month: string) {
    const [year, m] = month.split("-");
    const res = await fetch(
      `/api/movements?year=${year}&month=${m}&limit=1000`
    );
    if (!res.ok) return;
    const data = await res.json();
    const movs = data.data?.movements ?? [];
    for (const mov of movs) {
      await fetch(`/api/movements/${mov.id}`, { method: "DELETE" });
    }
    setExpandedMonth(null);
    fetchMonths(false);
    fetchSummary();
  }

  function handleDataChanged() {
    fetchMonths(false);
    fetchSummary();
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div>
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen del mes ·{" "}
            {new Intl.DateTimeFormat("es-AR", {
              month: "long",
              year: "numeric",
            }).format(now)}
          </p>
        </div>

        <SummaryCards data={summary} />

        {summaryLoading && !summary && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border p-5 space-y-3 bg-card">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Month Cards */}
      {loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-32" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3 bg-card">
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
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Historial de Meses
            </h2>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          {months.map((m) => (
            <MonthCard
              key={m.month}
              summary={m}
              expanded={expandedMonth === m.month}
              onToggle={() => toggleMonth(m.month)}
              onDelete={() => handleDeleteMonth(m.month)}
              onDataChanged={handleDataChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}
