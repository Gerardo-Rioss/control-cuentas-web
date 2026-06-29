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
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useState } from "react";

interface Movement {
  id: string;
  description: string;
  amount: number;
  type: "EGRESO" | "INGRESO";
  date: string;
  isPaid: boolean;
  category: { name: string; color: string };
}

interface Props {
  movements: Movement[];
  onTogglePaid: (id: string, isPaid: boolean) => Promise<void>;
  loading?: boolean;
}

export function ExpenseTable({ movements, onTogglePaid, loading }: Props) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const expenses = movements.filter((m) => m.type === "EGRESO");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Cargando movimientos...</span>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay gastos registrados este mes
      </div>
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((movement) => (
            <TableRow
              key={movement.id}
              className={movement.isPaid ? "bg-green-50/50 dark:bg-green-950/20" : ""}
            >
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToggle(movement)}
                  disabled={togglingId === movement.id}
                >
                  {togglingId === movement.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : movement.isPaid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TableCell>
              <TableCell className="font-medium">{movement.description}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  style={{ borderColor: movement.category.color, color: movement.category.color }}
                >
                  {movement.category.name}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(movement.amount)}
              </TableCell>
              <TableCell>
                <Badge variant={movement.isPaid ? "default" : "secondary"}>
                  {movement.isPaid ? "Pagado" : "Pendiente"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
