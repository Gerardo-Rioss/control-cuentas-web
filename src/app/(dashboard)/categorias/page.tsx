"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tag, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  type: "EGRESO" | "INGRESO";
}

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#8b5cf6", "#ec4899", "#6366f1", "#16a34a", "#2563eb",
  "#7c3aed", "#6b7280",
];

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "EGRESO" as "EGRESO" | "INGRESO", color: "#6366f1" });

  function fetchCategories() {
    setLoading(true);
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCategories(); }, []);

  function openNew() {
    setEditingCat(null);
    setForm({ name: "", type: "EGRESO", color: "#6366f1" });
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingCat(cat);
    setForm({ name: cat.name, type: cat.type, color: cat.color });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = editingCat ? `/api/categories/${editingCat.id}` : "/api/categories";
      const method = editingCat ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setDialogOpen(false);
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error || "Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`¿Eliminar categoría "${cat.name}"?`)) return;
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    if (res.ok) {
      fetchCategories();
    } else {
      const err = await res.json();
      alert(err.error || "Error al eliminar");
    }
  }

  const expenseCats = categories.filter((c) => c.type === "EGRESO");
  const incomeCats = categories.filter((c) => c.type === "INGRESO");

  function renderCategoryList(cats: Category[]) {
    return cats.map((cat) => (
      <div
        key={cat.id}
        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 group"
      >
        <div className="flex items-center gap-3">
          <span
            className="h-3.5 w-3.5 rounded-full ring-2 ring-offset-1"
            style={{ backgroundColor: cat.color }}
          />
          <span className="font-medium">{cat.name}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={() => openEdit(cat)}
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => handleDelete(cat)}
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    ));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná las categorías de gastos e ingresos
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" />
          Nueva Categoría
        </Button>
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
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-red-500" />
                Gastos
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {expenseCats.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseCats.length > 0 ? (
                <div className="space-y-2">{renderCategoryList(expenseCats)}</div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin categorías de gasto
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-500" />
                Ingresos
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {incomeCats.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeCats.length > 0 ? (
                <div className="space-y-2">{renderCategoryList(incomeCats)}</div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin categorías de ingreso
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
            <DialogDescription>
              {editingCat ? "Modificá el nombre, tipo o color." : "Agregá una nueva categoría para clasificar movimientos."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="catName">Nombre</Label>
              <Input
                id="catName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Vivienda"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="catType">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as "EGRESO" | "INGRESO" })}
              >
                <SelectTrigger id="catType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EGRESO">Gasto</SelectItem>
                  <SelectItem value="INGRESO">Ingreso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-8 w-8 rounded-full ring-2 ring-offset-1 transition-all hover:scale-110 ${
                      form.color === c ? "ring-foreground scale-110" : "ring-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {editingCat ? "Guardar cambios" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
