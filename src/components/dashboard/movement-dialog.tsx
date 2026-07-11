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
import { Loader2, Pencil } from "lucide-react";

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

interface MovementToEdit {
  id: string;
  description: string;
  amount: number;
  type: "EGRESO" | "INGRESO";
  categoryId: string;
  isPaid: boolean;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: MovementFormData, editId?: string) => Promise<void>;
  defaultType?: "EGRESO" | "INGRESO";
  editMovement?: MovementToEdit | null;
}

export function MovementDialog({ open, onOpenChange, onSave, defaultType = "EGRESO", editMovement }: Props) {
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

  const isEditing = !!editMovement;

  useEffect(() => {
    if (open) {
      if (editMovement) {
        setForm({
          description: editMovement.description,
          amount: String(editMovement.amount),
          type: editMovement.type,
          categoryId: editMovement.categoryId,
          isPaid: editMovement.isPaid,
          notes: editMovement.notes || "",
        });
      } else {
        setForm({
          description: "",
          amount: "",
          type: defaultType,
          categoryId: "",
          isPaid: false,
          notes: "",
        });
      }
      fetchCategories();
    }
  }, [open, editMovement, defaultType]);

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
      await onSave(
        {
          ...form,
          amount: form.amount.replace(/\./g, "").replace(",", "."),
        },
        editMovement?.id
      );
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <Pencil className="h-4 w-4" /> : null}
            {isEditing ? "Editar Movimiento" : "Nuevo Movimiento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los datos del movimiento seleccionado."
              : "Agregá un nuevo gasto o ingreso al mes activo."}
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPaid"
              checked={form.isPaid}
              onChange={(e) => setForm({ ...form, isPaid: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isPaid" className="text-sm cursor-pointer">
              Marcar como pagado
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
