"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExpenseTable } from "./expense-table";
import { IncomePanel } from "./income-panel";
import { PieChart } from "./pie-chart";
import { LineChart } from "./line-chart";
import { BarChart } from "./bar-chart";
import { MovementDialog } from "./movement-dialog";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Copy,
} from "lucide-react";
import { formatCurrency, parseMonthName } from "@/lib/utils";

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

interface MonthSummary {
  month: string;
  ingresos: number;
  egresos: number;
  count: number;
}

interface MonthCardProps {
  summary: MonthSummary;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDataChanged: () => void;
}

function todayForMonth(year: number, month: number): string {
  const now = new Date();
  const sameMonth =
    now.getFullYear() === year && now.getMonth() + 1 === month;
  if (sameMonth) {
    // Use today at noon local time to avoid UTC date shift
    return `${year}-${String(month).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T12:00:00`;
  }
  // Use the 15th at noon — safely in the middle of any month
  return `${year}-${String(month).padStart(2, "0")}-15T12:00:00`;
}

export function MonthCard({
  summary,
  expanded,
  onToggle,
  onDelete,
  onDataChanged,
}: MonthCardProps) {
  const [movements, setMovements] = useState<MovementData[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<MovementData | null>(
    null,
  );
  const [dupDialogOpen, setDupDialogOpen] = useState(false);
  const [dupTargetMonth, setDupTargetMonth] = useState("");
  const [dupLoading, setDupLoading] = useState(false);

  const [year, monthNum] = summary.month.split("-");
  const y = Number(year);
  const m = Number(monthNum);
  const monthLabel = `${parseMonthName(m)} ${year}`;
  const balance = summary.ingresos - summary.egresos;

  const fetchData = useCallback(async () => {
    if (!expanded) return;
    setLoading(true);
    try {
      const [movRes, sumRes] = await Promise.all([
        fetch(`/api/movements?year=${year}&month=${monthNum}&limit=200`),
        fetch(`/api/summary?year=${year}&month=${monthNum}`),
      ]);
      if (movRes.ok) {
        const d = await movRes.json();
        setMovements(d.data?.movements ?? []);
      }
      if (sumRes.ok) {
        const d = await sumRes.json();
        setChartData(d.data);
      }
    } catch (e) {
      console.error("Failed to fetch month data", e);
    } finally {
      setLoading(false);
    }
  }, [expanded, year, monthNum]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleTogglePaid(id: string, isPaid: boolean) {
    const res = await fetch(`/api/movements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid }),
    });
    if (res.ok) {
      setMovements((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isPaid } : m)),
      );
      await fetchData();
      onDataChanged();
    }
  }

  async function handleSaveMovement(
    data: {
      description: string;
      amount: string;
      type: "EGRESO" | "INGRESO";
      categoryId: string;
      isPaid: boolean;
      notes: string;
    },
    editId?: string,
  ) {
    const url = editId ? `/api/movements/${editId}` : "/api/movements";
    const method = editId ? "PATCH" : "POST";
    const numAmount = parseFloat(data.amount);

    const payload: Record<string, unknown> = {
      description: data.description,
      amount: numAmount,
      type: data.type,
      categoryId: data.categoryId,
      isPaid: data.isPaid,
      notes: data.notes || undefined,
    };

    // Force date into the current month being viewed (only for new movements)
    if (!editId) {
      payload.date = todayForMonth(y, m);
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resBody = await res
      .json()
      .catch(() => ({ error: "Invalid JSON response" }));

    if (!res.ok) {
      throw new Error(resBody.error || `Error ${res.status} al guardar`);
    }

    await fetchData();
    onDataChanged();
  }

  async function handleDeleteMovement(id: string) {
    const res = await fetch(`/api/movements/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMovements((prev) => prev.filter((m) => m.id !== id));
      await fetchData();
      onDataChanged();
    }
  }

  function handleEdit(movement: MovementData) {
    setEditingMovement(movement);
    setDialogOpen(true);
  }

  function handleNewMovement() {
    setEditingMovement(null);
    setDialogOpen(true);
  }

  function openDuplicateDialog() {
    const next = new Date(y, m, 1);
    const nextY = next.getFullYear();
    const nextM = String(next.getMonth() + 1).padStart(2, "0");
    setDupTargetMonth(`${nextY}-${nextM}`);
    setDupDialogOpen(true);
  }

  async function handleDuplicate() {
    if (!dupTargetMonth.match(/^\d{4}-\d{2}$/)) return;
    setDupLoading(true);
    try {
      const res = await fetch("/api/months/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMonth: summary.month,
          targetMonth: dupTargetMonth,
        }),
      });
      if (res.ok) {
        setDupDialogOpen(false);
        onDataChanged();
      } else {
        const err = await res.json();
        alert(err.error || "Error al duplicar");
      }
    } finally {
      setDupLoading(false);
    }
  }

  const incomes = movements.filter((m) => m.type === "INGRESO");

  const barChartData =
    chartData?.monthlyTrend && chartData.monthlyTrend.length >= 2
      ? (() => {
          const trend = chartData.monthlyTrend.filter(
            (t: any) => t.ingresos > 0 || t.egresos > 0,
          );
          const curr = trend[trend.length - 1];
          const prev = trend[trend.length - 2];
          if (!curr || !prev) return [];
          return [
            {
              name: "Ingresos",
              actual: curr.ingresos,
              previous: prev.ingresos,
            },
            {
              name: "Egresos",
              actual: curr.egresos,
              previous: prev.egresos,
            },
            {
              name: "Saldo",
              actual: curr.ingresos - curr.egresos,
              previous: prev.ingresos - prev.egresos,
            },
          ];
        })()
      : [];

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left hover:bg-muted/30 transition-colors"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {expanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
              <CardTitle className="text-lg">{monthLabel}</CardTitle>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-green-600">
                <TrendingUp className="h-3.5 w-3.5" />
                {formatCurrency(summary.ingresos)}
              </span>
              <span className="flex items-center gap-1.5 text-red-600">
                <TrendingDown className="h-3.5 w-3.5" />
                {formatCurrency(summary.egresos)}
              </span>
              <span
                className={`flex items-center gap-1.5 font-semibold ${
                  balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                <Wallet className="h-3.5 w-3.5" />
                {formatCurrency(balance)}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <Receipt className="h-3 w-3" />
                {summary.count}
              </span>
            </div>
          </div>
        </CardHeader>
      </button>

      {expanded && (
        <CardContent className="pb-6 pt-0 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleNewMovement}>
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Movimiento
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openDuplicateDialog}
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicar
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                if (
                  confirm(
                    `¿Eliminar todos los movimientos de ${monthLabel}?`,
                  )
                ) {
                  onDelete();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar mes
            </Button>
          </div>

          {chartData?.monthlyTrend && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Gastos por Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart data={chartData.byCategory} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Evolución Mensual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart data={chartData.monthlyTrend} />
                </CardContent>
              </Card>
            </div>
          )}

          {barChartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Comparativa con Mes Anterior
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={barChartData} />
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                Gastos
              </h3>
              <ExpenseTable
                movements={movements}
                onTogglePaid={handleTogglePaid}
                onEdit={handleEdit}
                onDelete={handleDeleteMovement}
                loading={loading}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                Ingresos
              </h3>
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

          <Dialog open={dupDialogOpen} onOpenChange={setDupDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Duplicar mes</DialogTitle>
                <DialogDescription>
                  Copiá todos los movimientos de{" "}
                  <strong>{monthLabel}</strong> a otro mes. Los movimientos
                  mantienen el mismo día y categoría, pero se marcan como no
                  pagados.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dupTarget">Mes destino (YYYY-MM)</Label>
                  <Input
                    id="dupTarget"
                    value={dupTargetMonth}
                    onChange={(e) => setDupTargetMonth(e.target.value)}
                    placeholder="2026-08"
                    pattern="\d{4}-\d{2}"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDupDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDuplicate}
                  disabled={
                    dupLoading || !dupTargetMonth.match(/^\d{4}-\d{2}$/)
                  }
                >
                  {dupLoading ? "Duplicando..." : "Duplicar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      )}
    </Card>
  );
}
