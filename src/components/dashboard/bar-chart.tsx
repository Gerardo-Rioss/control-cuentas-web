"use client";

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface ComparisonData {
  name: string;
  actual: number;
  previous: number;
}

interface Props {
  data: ComparisonData[];
}

const barColors = {
  success: "var(--color-success, oklch(0.627 0.194 149.214))",
  destructive: "var(--color-destructive, oklch(0.577 0.245 27.325))",
  muted: "var(--color-muted-foreground, oklch(0.556 0 0))",
};

export function BarChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        Sin datos comparativos
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="name"
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
                formatter={(value: number) =>
                  `$${Number(value).toLocaleString("es-AR")}`
                }
              />
            }
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-sm text-muted-foreground">
                {value === "actual" ? "Mes actual" : "Mes anterior"}
              </span>
            )}
            iconType="rect"
          />
          <Bar
            dataKey="actual"
            name="actual"
            radius={[4, 4, 0, 0]}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.actual >= entry.previous ? barColors.success : barColors.destructive}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
          <Bar
            dataKey="previous"
            name="previous"
            fill={barColors.muted}
            fillOpacity={0.3}
            radius={[4, 4, 0, 0]}
            animationBegin={200}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
