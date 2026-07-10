"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseMonthName } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  months: string[];
  active: string;
  onChange: (month: string) => void;
}

export function MonthSelector({ months, active, onChange }: Props) {
  const current = months.find((m) => m === active) || months[0];
  const currentDate = current ? new Date(current + "-01") : new Date();
  const currentYear = currentDate.getFullYear();

  const allMonths: string[] = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    allMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  for (const m of months) {
    if (!allMonths.includes(m)) {
      allMonths.push(m);
    }
  }
  allMonths.sort();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Tabs value={active} onValueChange={onChange} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide">
          {allMonths.map((month) => {
            const d = new Date(month + "-01");
            const label = `${parseMonthName(d.getMonth() + 1)}`;
            const isActive = month === active;
            return (
              <TabsTrigger
                key={month}
                value={month}
                className="min-w-fit transition-all data-[state=active]:shadow-sm"
              >
                <span className="hidden sm:inline">{label} </span>
                <span className="sm:hidden">
                  {label.slice(0, 3)}
                </span>
                <span className="ml-1 text-xs opacity-60">{d.getFullYear()}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </motion.div>
  );
}
