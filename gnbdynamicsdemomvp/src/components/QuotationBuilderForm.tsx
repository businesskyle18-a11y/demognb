"use client";

import { useState } from "react";
import { createQuotation } from "@/app/quotations/actions";
import { Field, inputClass, Button } from "@/components/ui";

type Row = { description: string; qty: number; unitPrice: number };

export default function QuotationBuilderForm({
  clients,
  rfqs,
  defaultRfqId,
  ceiling,
}: {
  clients: { id: string; companyName: string }[];
  rfqs: { id: string; clientId: string; specsText: string }[];
  defaultRfqId?: string;
  ceiling: number;
}) {
  const defaultRfq = rfqs.find((r) => r.id === defaultRfqId);
  const [clientId, setClientId] = useState(defaultRfq?.clientId ?? clients[0]?.id ?? "");
  const [rfqId, setRfqId] = useState(defaultRfqId ?? "");
  const [rows, setRows] = useState<Row[]>([{ description: "", qty: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(0);

  const subtotal = rows.reduce((s, r) => s + r.qty * r.unitPrice, 0);
  const total = subtotal - discount;
  const overCeiling = total > ceiling;

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <form action={createQuotation}>
      <Field label="Client">
        <select
          name="clientId"
          required
          className={inputClass}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Linked RFQ (optional)">
        <select name="rfqId" className={inputClass} value={rfqId} onChange={(e) => setRfqId(e.target.value)}>
          <option value="">— none —</option>
          {rfqs
            .filter((r) => r.clientId === clientId)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.specsText.slice(0, 40)}
                {r.specsText.length > 40 ? "…" : ""}
              </option>
            ))}
        </select>
      </Field>

      <div className="mb-2">
        <span className="block text-xs font-medium text-slate-600 mb-1">Line items</span>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <input
                name="description[]"
                placeholder="Description"
                required
                value={row.description}
                onChange={(e) => updateRow(i, { description: e.target.value })}
                className={`${inputClass} flex-1`}
              />
              <input
                name="qty[]"
                type="number"
                min={0}
                step="any"
                placeholder="Qty"
                value={row.qty}
                onChange={(e) => updateRow(i, { qty: Number(e.target.value) })}
                className={`${inputClass} w-16`}
              />
              <input
                name="unitPrice[]"
                type="number"
                min={0}
                step="any"
                placeholder="Unit ₱"
                value={row.unitPrice}
                onChange={(e) => updateRow(i, { unitPrice: Number(e.target.value) })}
                className={`${inputClass} w-24`}
              />
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-slate-400 hover:text-rose-600 text-sm px-1"
                aria-label="Remove line"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { description: "", qty: 1, unitPrice: 0 }])}
          className="text-xs text-sky-700 hover:underline mt-2"
        >
          + Add line item
        </button>
      </div>

      <Field label="Discount (₱)">
        <input
          name="discount"
          type="number"
          min={0}
          step="any"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
          className={inputClass}
        />
      </Field>

      <div className="rounded-md bg-slate-50 border border-slate-200 p-3 mb-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Subtotal</span>
          <span>₱{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Discount</span>
          <span>-₱{discount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-semibold border-t border-slate-200 mt-1 pt-1">
          <span>Total</span>
          <span>₱{total.toLocaleString()}</span>
        </div>
        {overCeiling && (
          <div className="text-xs text-amber-700 mt-2">
            Exceeds the ₱{ceiling.toLocaleString()} approval ceiling — this quotation will require Management
            approval before a Job Order can be created.
          </div>
        )}
      </div>

      <Button>Save Quotation</Button>
    </form>
  );
}
