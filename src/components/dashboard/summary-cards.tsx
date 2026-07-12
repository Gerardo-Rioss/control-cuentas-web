"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant: "success" | "danger" | "info";
  subtext?: string;
}

const variants = {
  success: {
    gradient: "from-emerald-600/20 to-emerald-600/5",
    iconBg: "bg-emerald-600/15 text-emerald-600",
    border: "border-emerald-600/20",
  },
  danger: {
    gradient: "from-red-600/20 to-red-600/5",
    iconBg: "bg-red-600/15 text-red-600",
    border: "border-red-600/20",
  },
  info: {
    gradient: "from-blue-600/20 to-blue-600/5",
    iconBg: "bg-blue-600/15 text-blue-600",
    border: "border-blue-600/20",
  },
};

function StatsCard({ title, value, icon: Icon, variant, subtext }: StatsCardProps) {
  const v = variants[variant];

  return (
    <Card className={`bg-gradient-to-br ${v.gradient} ${v.border} border`}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtext && (
              <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
          </div>
          <div className={`rounded-xl p-2.5 ${v.iconBg}`}>
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
}

export function SummaryCards({ data }: { data: SummaryData | null }) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 md:p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-8 w-32 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard
        title="Ingresos"
        value={formatCurrency(data.totalIngresos)}
        icon={TrendingUp}
        variant="success"
        subtext={`${data.totalMovements} movimientos`}
      />
      <StatsCard
        title="Egresos"
        value={formatCurrency(data.totalEgresos)}
        icon={TrendingDown}
        variant="danger"
        subtext="Gastos del mes"
      />
      <StatsCard
        title="Saldo"
        value={formatCurrency(data.balance)}
        icon={Wallet}
        variant={data.balance >= 0 ? "success" : "danger"}
        subtext={data.balance >= 0 ? "Saldo positivo ✅" : "Saldo negativo ⚠️"}
      />
    </div>
  );
}
