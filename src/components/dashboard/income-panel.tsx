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
  const total = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando...</div>;
  }

  if (incomes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay ingresos registrados este mes
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ingreso</TableHead>
            <TableHead className="text-right">Monto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incomes.map((inc) => (
            <TableRow key={inc.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    style={{ borderColor: inc.category.color, color: inc.category.color }}
                  >
                    {inc.category.name}
                  </Badge>
                  <span>{inc.description}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-green-600">
                +{formatCurrency(inc.amount)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold">
            <TableCell>Total Ingresos</TableCell>
            <TableCell className="text-right font-mono text-green-600">
              +{formatCurrency(total)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
