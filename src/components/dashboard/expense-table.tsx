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
import { CheckCircle2, Circle, Loader2, Pencil, Trash2, CreditCard } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Movement {
  id: string;
  description: string;
  amount: number;
  type: "EGRESO" | "INGRESO";
  date: string;
  isPaid: boolean;
  notes: string | null;
  category: { name: string; color: string; id: string };
  categoryId: string;
}

interface Props {
  movements: Movement[];
  onTogglePaid: (id: string, isPaid: boolean) => Promise<void>;
  onEdit: (movement: Movement) => void;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

export function ExpenseTable({ movements, onTogglePaid, onEdit, onDelete, loading }: Props) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const expenses = movements.filter((m) => m.type === "EGRESO");

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border p-4 animate-pulse">
            <div className="h-5 w-5 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
            <div className="h-5 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <CreditCard className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Sin gastos este mes
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Agregá tu primer gasto con el botón "Nuevo Movimiento"
        </p>
      </motion.div>
    );
  }

  async function handleToggle(movement: Movement) {
    setTogglingId(movement.id);
    try {
      await onTogglePaid(movement.id, !movement.isPaid);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(movement: Movement) {
    if (!confirm(`¿Eliminar "${movement.description}"?`)) return;
    setDeletingId(movement.id);
    try {
      await onDelete(movement.id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-20 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {expenses.map((movement, index) => (
              <motion.tr
                key={movement.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                className={`group transition-colors hover:bg-muted/50 ${
                  movement.isPaid ? "bg-success/5" : ""
                }`}
              >
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 transition-transform hover:scale-110"
                    onClick={() => handleToggle(movement)}
                    disabled={togglingId === movement.id}
                  >
                    {togglingId === movement.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : movement.isPaid ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </motion.div>
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{movement.description}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="transition-all hover:scale-105"
                    style={{
                      borderColor: movement.category.color,
                      color: movement.category.color,
                      backgroundColor: `${movement.category.color}10`,
                    }}
                  >
                    <span
                      className="mr-1.5 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: movement.category.color }}
                    />
                    {movement.category.name}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatCurrency(movement.amount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={movement.isPaid ? "default" : "secondary"}
                    className="transition-all"
                  >
                    {movement.isPaid ? "Pagado" : "Pendiente"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => onEdit(movement)}
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => handleDelete(movement)}
                      disabled={deletingId === movement.id}
                      title="Eliminar"
                    >
                      {deletingId === movement.id ? (
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
        </TableBody>
      </Table>
    </div>
  );
}
