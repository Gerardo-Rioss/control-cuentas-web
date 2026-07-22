"use client";

import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface TrendItem {
  month: string;
  ingresos: number;
  egresos: number;
}

interface Props {
  data: TrendItem[];
}

const formatMonth = (month: string) => {
  const [y, m] = month.split("-");
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  return `${months[parseInt(m) - 1]} ${y}`;
};

const lineColors = {
  success: "var(--color-success, oklch(0.627 0.194 149.214))",
  destructive: "var(--color-destructive, oklch(0.577 0.245 27.325))",
};

export function LineChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        Sin datos mensuales
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLine data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip
            content={
              <ChartTooltip
                labelFormatter={(label: string) => formatMonth(String(label))}
              />
            }
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-sm text-muted-foreground">
                {value === "ingresos" ? "Ingresos" : "Egresos"}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="ingresos"
            name="ingresos"
            stroke={lineColors.success}
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 2, fill: "var(--color-card, white)" }}
            activeDot={{ r: 7, strokeWidth: 2 }}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="egresos"
            name="egresos"
            stroke={lineColors.destructive}
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 2, fill: "var(--color-card, white)" }}
            activeDot={{ r: 7, strokeWidth: 2 }}
            animationDuration={1000}
            animationEasing="ease-out"
            animationBegin={200}
          />
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  );
}
