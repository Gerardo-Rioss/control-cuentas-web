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

interface ComparisonData {
  name: string;
  actual: number;
  previous: number;
}

interface Props {
  data: ComparisonData[];
}

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
            formatter={(value) => [
              `$${Number(value).toLocaleString("es-AR")}`,
            ]}
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-sm text-muted-foreground">
                {value === "actual" ? "Mes actual" : "Mes anterior"}
              </span>
            )}
          />
          <Bar dataKey="actual" name="actual" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.actual >= entry.previous ? "#16a34a" : "#ef4444"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
          <Bar
            dataKey="previous"
            name="previous"
            fill="#6b7280"
            fillOpacity={0.4}
            radius={[4, 4, 0, 0]}
          />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
