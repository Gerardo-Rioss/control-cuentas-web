"use client";

import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type PieLabelRenderProps,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface CategoryData {
  name: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

interface Props {
  data: CategoryData[];
}

function renderCustomizedLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: PieLabelRenderProps) {
  const radius = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 0.5;
  const x = (cx as number) + radius * Math.cos(-(midAngle as number) * (Math.PI / 180));
  const y = (cy as number) + radius * Math.sin(-(midAngle as number) * (Math.PI / 180));

  if ((percent ?? 0) < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  );
}

export function PieChart({ data }: Props) {
  const expenses = data.filter((d) => d.total > 0);

  if (expenses.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No hay gastos este mes
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPie>
          <Pie
            data={expenses}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            dataKey="total"
            nameKey="name"
            animationDuration={800}
            animationEasing="ease-out"
          >
            {expenses.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={
              <ChartTooltip
                valuePrefix="$"
              />
            }
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-sm text-muted-foreground">{value}</span>
            )}
            iconType="circle"
          />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
}
