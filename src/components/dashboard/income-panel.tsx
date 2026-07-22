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
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Loader2, Pencil, TrendingUp } from "lucide-react";
import { useState } from "react";

interface IncomeMovement {
  id: string;
  description: string;
  amount: number;
  date: string;
  isPaid: boolean;
  notes: string | null;
  category: { name: string; color: string; id: string };
  categoryId: string;
  type: "INGRESO";
}

interface Props {
  incomes: IncomeMovement[];
  onEdit: (movement: IncomeMovement) => void;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

export function IncomePanel({ incomes, onEdit, onDelete, loading }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <TrendingUp className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Sin ingresos este mes
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Registrá tu primer ingreso para verlo reflejado aquí
        </p>
      </motion.div>
    );
  }

  async function handleDelete(inc: IncomeMovement) {
    if (!confirm(`¿Eliminar ingreso "${inc.description}"?`)) return;
    setDeletingId(inc.id);
    try {
      await onDelete(inc.id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ingreso</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="w-16 text-right">Acción</TableHead>
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
                <TableCell className="text-right font-mono tabular-nums text-success">
                  +{formatCurrency(inc.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => onEdit(inc)}
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => handleDelete(inc)}
                      disabled={deletingId === inc.id}
                      title="Eliminar"
                    >
                      {deletingId === inc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
          <TableRow className="font-bold bg-muted/30">
            <TableCell>Total Ingresos</TableCell>
            <TableCell className="text-right font-mono text-success tabular-nums">
              <motion.span
                key={total}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                +{formatCurrency(total)}
              </motion.span>
            </TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
