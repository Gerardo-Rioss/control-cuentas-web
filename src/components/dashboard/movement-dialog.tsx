"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
  type: "EGRESO" | "INGRESO";
}

interface MovementFormData {
  description: string;
  amount: string;
  type: "EGRESO" | "INGRESO";
  categoryId: string;
  isPaid: boolean;
  notes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: MovementFormData) => Promise<void>;
  defaultType?: "EGRESO" | "INGRESO";
}

export function MovementDialog({ open, onOpenChange, onSave, defaultType = "EGRESO" }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MovementFormData>({
    description: "",
    amount: "",
    type: defaultType,
    categoryId: "",
    isPaid: false,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        description: "",
        amount: "",
        type: defaultType,
        categoryId: "",
        isPaid: false,
        notes: "",
      });
      fetchCategories();
    }
  }, [open, defaultType]);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  const filteredCategories = categories.filter((c) => c.type === form.type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount || !form.categoryId) return;

    setSaving(true);
    try {
      await onSave({
        ...form,
        amount: form.amount.replace(/\./g, "").replace(",", "."),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Movimiento</DialogTitle>
          <DialogDescription>
            Agregá un nuevo gasto o ingreso al mes activo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={form.type === "EGRESO" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setForm({ ...form, type: "EGRESO", categoryId: "" })}
            >
              Gasto
            </Button>
            <Button
              type="button"
              variant={form.type === "INGRESO" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setForm({ ...form, type: "INGRESO", categoryId: "" })}
            >
              Ingreso
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ej: Tarjeta Naranja"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto ($)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, "");
                setForm({ ...form, amount: val });
              }}
              placeholder="Ej: 100000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={form.categoryId}
              onValueChange={(v) => v && setForm({ ...form, categoryId: v })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Cargando..." : "Seleccionar categoría"} />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
                {filteredCategories.length === 0 && !loading && (
                  <SelectItem value="_none" disabled>
                    Sin categorías disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
