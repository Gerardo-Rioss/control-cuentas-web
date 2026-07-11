"use client";

import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseMonthName } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  months: string[];
  active: string;
  onChange: (month: string) => void;
  onDeleteMonth?: (month: string) => void;
  onExpandPrev?: () => void;
  onExpandNext?: () => void;
}

export function MonthSelector({ months, active, onChange, onDeleteMonth, onExpandPrev, onExpandNext }: Props) {
  const currentIndex = months.indexOf(active);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < months.length - 1;

  function goPrev() {
    if (hasPrev) {
      onChange(months[currentIndex - 1]);
    } else if (onExpandPrev) {
      onExpandPrev();
      // onChange will be called by the parent after expanding
    }
  }

  function goNext() {
    if (hasNext) {
      onChange(months[currentIndex + 1]);
    } else if (onExpandNext) {
      onExpandNext();
    }
  }

  const d = active ? new Date(active + "-01") : new Date();
  const monthLabel = parseMonthName(d.getMonth() + 1);
  const yearLabel = d.getFullYear();

  async function handleDeleteMonth() {
    if (!onDeleteMonth) return;
    if (!confirm(`¿Eliminar TODOS los movimientos de ${monthLabel} ${yearLabel}?`)) return;
    onDeleteMonth(active);
  }

  if (months.length === 0) {
    return (
      <div className="py-4 text-sm text-muted-foreground text-center">
        No hay meses disponibles
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between gap-2 rounded-lg border bg-card p-2"
    >
      {/* Previous month */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goPrev}
        disabled={!hasPrev}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Month tabs - horizontal scroll */}
      <div className="flex-1 overflow-x-auto scrollbar-hide flex gap-1 justify-center">
        {months.map((month) => {
          const date = new Date(month + "-01");
          const label = parseMonthName(date.getMonth() + 1);
          const isActive = month === active;
          return (
            <button
              key={month}
              onClick={() => onChange(month)}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all
                ${isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }
              `}
            >
              <span className="hidden sm:inline">{label} </span>
              <span className="sm:hidden">{label.slice(0, 3)}</span>
              <span className="ml-0.5 text-xs opacity-70">{date.getFullYear()}</span>
            </button>
          );
        })}
      </div>

      {/* Next month */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goNext}
        disabled={!hasNext}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Delete month */}
      {onDeleteMonth && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDeleteMonth}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          title={`Eliminar ${monthLabel} ${yearLabel}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
}
