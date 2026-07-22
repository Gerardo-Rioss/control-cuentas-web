"use client";

export function ChartTooltip({ active, payload, label, valuePrefix = "$" }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-lg">
      {label && (
        <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium tabular-nums text-popover-foreground">
              {valuePrefix}
              {Number(entry.value).toLocaleString("es-AR")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
