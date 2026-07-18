"use client";

import { useState } from "react";
import { createMaterialRequest } from "@/app/job-orders/actions";
import { inputClass, Button } from "@/components/ui";

type Row = { item: string; qty: number };

export default function MaterialRequestForm({ jobOrderId }: { jobOrderId: string }) {
  const [rows, setRows] = useState<Row[]>([{ item: "", qty: 1 }]);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <form action={createMaterialRequest}>
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <div className="space-y-2 mb-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              name="item[]"
              placeholder="Item name (matches Inventory)"
              required
              value={row.item}
              onChange={(e) => updateRow(i, { item: e.target.value })}
              className={`${inputClass} flex-1`}
            />
            <input
              name="qty[]"
              type="number"
              min={0}
              step="any"
              value={row.qty}
              onChange={(e) => updateRow(i, { qty: Number(e.target.value) })}
              className={`${inputClass} w-20`}
            />
            <button
              type="button"
              onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
              className="text-slate-400 hover:text-rose-600 text-sm px-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, { item: "", qty: 1 }])}
        className="text-xs text-sky-700 hover:underline mb-3 block"
      >
        + Add item
      </button>
      <Button>Submit Material Request</Button>
    </form>
  );
}
