"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseMonthName } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  months: string[];
  active: string;
  onChange: (month: string) => void;
}

export function MonthSelector({ months, active, onChange }: Props) {
  if (months.length === 0) {
    return (
      <div className="py-2 text-sm text-muted-foreground">
        No hay meses con movimientos registrados
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Tabs value={active} onValueChange={onChange} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide">
          {months.map((month) => {
            const d = new Date(month + "-01");
            const label = parseMonthName(d.getMonth() + 1);
            return (
              <TabsTrigger
                key={month}
                value={month}
                className="min-w-fit transition-all data-[state=active]:shadow-sm"
              >
                <span className="hidden sm:inline">{label} </span>
                <span className="sm:hidden">{label.slice(0, 3)}</span>
                <span className="ml-1 text-xs opacity-60">{d.getFullYear()}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </motion.div>
  );
}
