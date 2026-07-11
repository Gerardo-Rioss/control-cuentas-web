"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default function ReportesPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    fetch(`/api/summary?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => setSummary(d.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Resumen financiero y exportación de datos
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 animate-pulse">
                <div className="h-5 w-24 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-green-600/15 p-2.5 text-green-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos</p>
                    <p className="text-xl font-bold">{formatCurrency(summary.totalIngresos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-red-600/15 p-2.5 text-red-600">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Egresos</p>
                    <p className="text-xl font-bold">{formatCurrency(summary.totalEgresos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-600/15 p-2.5 text-blue-600">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className={`text-xl font-bold ${summary.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(summary.balance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {summary.monthlyTrend && summary.monthlyTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Datos Mensuales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 font-medium">Mes</th>
                        <th className="text-right py-2 font-medium">Ingresos</th>
                        <th className="text-right py-2 font-medium">Egresos</th>
                        <th className="text-right py-2 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.monthlyTrend.map((t: any) => (
                        <tr key={t.month} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-2 font-medium">{t.month}</td>
                          <td className="py-2 text-right text-green-600">{formatCurrency(t.ingresos)}</td>
                          <td className="py-2 text-right text-red-600">{formatCurrency(t.egresos)}</td>
                          <td className={`py-2 text-right font-medium ${t.ingresos - t.egresos >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(t.ingresos - t.egresos)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">No hay datos disponibles</p>
      )}
    </div>
  );
}
