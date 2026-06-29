"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseMonthName } from "@/lib/utils";

interface Props {
  months: string[];
  active: string;
  onChange: (month: string) => void;
}

export function MonthSelector({ months, active, onChange }: Props) {
  // Parse "YYYY-MM" format
  const current = months.find((m) => m === active) || months[0];
  const currentDate = current ? new Date(current + "-01") : new Date();
  const currentYear = currentDate.getFullYear();

  // Show last 6 months + current
  const allMonths: string[] = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    allMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  // Also include any months from data that aren't in the last 6
  for (const m of months) {
    if (!allMonths.includes(m)) {
      allMonths.push(m);
    }
  }
  allMonths.sort();

  return (
    <Tabs value={active} onValueChange={onChange} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        {allMonths.map((month) => {
          const d = new Date(month + "-01");
          const label = `${parseMonthName(d.getMonth() + 1)} ${d.getFullYear()}`;
          return (
            <TabsTrigger key={month} value={month} className="min-w-fit">
              {label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
