"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  type: "EGRESO" | "INGRESO";
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const expenseCats = categories.filter((c) => c.type === "EGRESO");
  const incomeCats = categories.filter((c) => c.type === "INGRESO");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná las categorías de gastos e ingresos
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 animate-pulse">
                <div className="h-5 w-32 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-red-500" />
                Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expenseCats.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <Badge variant="secondary">EGRESO</Badge>
                  </div>
                ))}
                {expenseCats.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin categorías de gasto</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-500" />
                Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {incomeCats.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <Badge variant="secondary">INGRESO</Badge>
                  </div>
                ))}
                {incomeCats.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin categorías de ingreso</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
