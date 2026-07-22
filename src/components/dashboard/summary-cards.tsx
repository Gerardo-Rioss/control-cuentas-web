"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, type LucideIcon } from "lucide-react";
import { AnimatedCounter } from "./animated-counter";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: "success" | "danger" | "info";
  subtext?: string;
  trend?: { value: number; isPositive: boolean } | null;
}

const variants = {
  success: {
    border: "hover:border-success/40",
    iconBg: "bg-success/15 text-success",
    accent: "bg-success",
  },
  danger: {
    border: "hover:border-destructive/40",
    iconBg: "bg-destructive/15 text-destructive",
    accent: "bg-destructive",
  },
  info: {
    border: "hover:border-info/40",
    iconBg: "bg-info/15 text-info",
    accent: "bg-info",
  },
};

function StatsCard({ title, value, icon: Icon, variant, subtext, trend }: StatsCardProps) {
  const v = variants[variant];

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 ${v.border} hover:shadow-lg hover:-translate-y-0.5 group`}
    >
      {/* Accent bar at top */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${v.accent} opacity-60`} />

      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground tracking-wide">
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              <AnimatedCounter
                value={value}
                formatter={(v) => formatCurrency(v).replace(/^ARS\s*/, "$")}
              />
            </p>
            {trend && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                    trend.isPositive ? "text-success" : "text-destructive"
                  }`}
                >
                  {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">vs. mes anterior</span>
              </div>
            )}
            {subtext && !trend && (
              <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
          </div>
          <div
            className={`rounded-xl p-3 ${v.iconBg} transition-transform duration-300 group-hover:scale-110 shrink-0`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SummaryData {
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  totalMovements: number;
  monthlyTrend?: Array<{ month: string; ingresos: number; egresos: number }>;
}

export function SummaryCards({ data }: { data: SummaryData | null }) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-9 w-36 rounded bg-muted" />
                <div className="h-3 w-28 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate trend from monthlyTrend if available
  const getTrend = (key: "ingresos" | "egresos"): { value: number; isPositive: boolean } | null => {
    if (!data.monthlyTrend || data.monthlyTrend.length < 2) return null;
    const current = data.monthlyTrend[data.monthlyTrend.length - 1][key];
    const previous = data.monthlyTrend[data.monthlyTrend.length - 2][key];
    if (previous === 0) return null;
    const pct = ((current - previous) / previous) * 100;
    return { value: Math.round(pct * 10) / 10, isPositive: pct >= 0 };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard
        title="Ingresos del Mes"
        value={data.totalIngresos}
        icon={TrendingUp}
        variant="success"
        trend={getTrend("ingresos")}
      />
      <StatsCard
        title="Egresos del Mes"
        value={data.totalEgresos}
        icon={TrendingDown}
        variant="danger"
        trend={getTrend("egresos")}
      />
      <StatsCard
        title="Saldo Disponible"
        value={data.balance}
        icon={Wallet}
        variant={data.balance >= 0 ? "success" : "danger"}
        subtext={
          data.balance >= 0
            ? "✅ Saldo positivo"
            : "⚠️ Saldo negativo"
        }
      />
    </div>
  );
}
