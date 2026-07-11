"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface IncomeMovement {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: { name: string; color: string };
}

interface Props {
  incomes: IncomeMovement[];
  loading?: boolean;
}

export function IncomePanel({ incomes, loading }: Props) {
  const total = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse space-y-2 rounded-lg border p-4">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-6 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (incomes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8 text-muted-foreground"
      >
        No hay ingresos registrados este mes
      </motion.div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ingreso</TableHead>
            <TableHead className="text-right">Monto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {incomes.map((inc, index) => (
              <motion.tr
                key={inc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className="transition-colors hover:bg-muted/50"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="transition-all hover:scale-105"
                      style={{
                        borderColor: inc.category.color,
                        color: inc.category.color,
                        backgroundColor: `${inc.category.color}10`,
                      }}
                    >
                      <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: inc.category.color }}
                      />
                      {inc.category.name}
                    </Badge>
                    <span>{inc.description}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-green-600">
                  +{formatCurrency(inc.amount)}
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
          <TableRow className="font-bold bg-muted/30">
            <TableCell>Total Ingresos</TableCell>
            <TableCell className="text-right font-mono text-green-600 tabular-nums">
              <motion.span
                key={total}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                +{formatCurrency(total)}
              </motion.span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
