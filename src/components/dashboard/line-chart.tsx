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
            formatter={(value, name) => [
              `$${Number(value).toLocaleString("es-AR")}`,
              name === "ingresos" ? "Ingresos" : "Egresos",
            ]}
            labelFormatter={(label) => formatMonth(String(label))}
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
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="egresos"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  );
}
