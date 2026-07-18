import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess, currency, formatDate } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, EmptyState, Field, inputClass, Button } from "@/components/ui";
import { TabNav } from "@/components/TabNav";
import {
  createRequestToPurchase,
  issuePurchaseOrder,
  receivePurchaseOrder,
  requestPoFunds,
  createSubcontractorWorkOrder,
  awardSubcontractor,
  updateSubcontractorStatus,
  requestSubcontractorPayment,
} from "./actions";

const TABS = [
  { key: "requests", label: "Request-to-Purchase" },
  { key: "pos", label: "Purchase Orders" },
  { key: "subcontractors", label: "Subcontractors" },
];

export default async function PurchasingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "purchasing")) return <Restricted moduleLabel="Purchasing" />;
  const { tab = "requests" } = await searchParams;

  const [requests, pos, subcontractors, jobOrders] = await Promise.all([
    prisma.requestToPurchase.findMany({ include: { requestedBy: true, purchaseOrders: true }, orderBy: { createdAt: "desc" } }),
    prisma.purchaseOrder.findMany({ include: { requestToPurchase: true }, orderBy: { createdAt: "desc" } }),
    prisma.subcontractorWorkOrder.findMany({ include: { jobOrder: true }, orderBy: { createdAt: "desc" } }),
    prisma.jobOrder.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Purchasing" subtitle="Request-to-Purchase → sourcing → PO → receiving (→ Inventory) → funds request (→ Accounting)." />
      <TabNav base="/purchasing" tabs={TABS} active={tab} />

      {tab === "requests" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-1 h-fit">
            <div className="font-medium text-sm mb-3">New Request-to-Purchase</div>
            <form action={createRequestToPurchase}>
              <Field label="Source">
                <select name="sourceType" className={inputClass}>
                  <option value="inventory">Inventory</option>
                  <option value="tool_equipment">Tool/Equipment</option>
                  <option value="job_order">Job Order</option>
                </select>
              </Field>
              <Field label="Item">
                <input name="item" required className={inputClass} />
              </Field>
              <Field label="Qty">
                <input name="qty" type="number" step="any" required className={inputClass} />
              </Field>
              <Field label="Notes">
                <input name="notes" className={inputClass} />
              </Field>
              <Button>Submit Request</Button>
            </form>
          </Card>
          <Card className="lg:col-span-2 overflow-x-auto">
            {requests.length === 0 ? (
              <EmptyState text="No requests yet." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-2">Source</th>
                    <th className="px-4 py-2">Items</th>
                    <th className="px-4 py-2">Requested By</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const items: { item: string; qty: number; notes: string }[] = JSON.parse(r.items);
                    return (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0 align-top">
                        <td className="px-4 py-2 capitalize text-slate-600">{r.sourceType.replace(/_/g, " ")}</td>
                        <td className="px-4 py-2 text-slate-700">
                          {items.map((it, i) => (
                            <div key={i}>
                              {it.item} × {it.qty}
                            </div>
                          ))}
                        </td>
                        <td className="px-4 py-2 text-slate-500">{r.requestedBy.name}</td>
                        <td className="px-4 py-2">
                          <Badge value={r.status} />
                        </td>
                        <td className="px-4 py-2">
                          {r.status === "pending" && (
                            <form action={issuePurchaseOrder} className="space-y-1">
                              <input type="hidden" name="requestToPurchaseId" value={r.id} />
                              <input name="supplierName" placeholder="Supplier" required className="text-xs rounded border border-slate-300 px-1.5 py-1 w-full" />
                              <input name="unitPrice" type="number" step="any" placeholder="Unit price ₱" required className="text-xs rounded border border-slate-300 px-1.5 py-1 w-full" />
                              <button className="text-xs bg-slate-900 text-white rounded px-2 py-1">Issue PO</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {tab === "pos" && (
        <Card className="overflow-x-auto">
          {pos.length === 0 ? (
            <EmptyState text="No purchase orders yet." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2">Supplier</th>
                  <th className="px-4 py-2">Items</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Issued</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pos.map((po) => {
                  const items: { item: string; qty: number; unitPrice: number }[] = JSON.parse(po.items);
                  return (
                    <tr key={po.id} className="border-b border-slate-100 last:border-0 align-top">
                      <td className="px-4 py-2 font-medium text-slate-800">{po.supplierName}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {items.map((it, i) => (
                          <div key={i}>
                            {it.item} × {it.qty} @ {currency(it.unitPrice)}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-2">{currency(po.totalAmount)}</td>
                      <td className="px-4 py-2 text-slate-500">{po.issuedDate ? formatDate(po.issuedDate) : "—"}</td>
                      <td className="px-4 py-2">
                        <Badge value={po.status} />
                      </td>
                      <td className="px-4 py-2 space-y-1">
                        {po.status === "issued" && (
                          <form action={receivePurchaseOrder}>
                            <input type="hidden" name="id" value={po.id} />
                            <button className="text-xs text-emerald-700 hover:underline block">Receive (→ Inventory)</button>
                          </form>
                        )}
                        <form action={requestPoFunds}>
                          <input type="hidden" name="id" value={po.id} />
                          <button className="text-xs text-sky-700 hover:underline block">Request Funds (→ Accounting)</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "subcontractors" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-1 h-fit">
            <div className="font-medium text-sm mb-3">New Subcontractor Work Order</div>
            <form action={createSubcontractorWorkOrder}>
              <Field label="Job Order">
                <select name="jobOrderId" required className={inputClass}>
                  {jobOrders.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.jobNumber} — {j.client.companyName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Scope of work">
                <textarea name="scopeOfWork" rows={2} required className={inputClass} />
              </Field>
              <Field label="Timeline">
                <input name="timeline" placeholder="e.g. 2 days" className={inputClass} />
              </Field>
              <span className="block text-xs font-medium text-slate-600 mb-1">Quotations received (min. 3)</span>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-1.5 mb-1.5">
                  <input name="supplier[]" placeholder="Supplier" className={`${inputClass} flex-1`} />
                  <input name="amount[]" type="number" step="any" placeholder="₱" className={`${inputClass} w-24`} />
                </div>
              ))}
              <Button>Submit for Sourcing</Button>
            </form>
          </Card>
          <Card className="lg:col-span-2 overflow-x-auto">
            {subcontractors.length === 0 ? (
              <EmptyState text="No subcontractor work orders yet." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-2">Job Order</th>
                    <th className="px-4 py-2">Scope</th>
                    <th className="px-4 py-2">Quotations</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Payment</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {subcontractors.map((s) => {
                    const quotes: { supplier: string; amount: number }[] = JSON.parse(s.quotationsReceived);
                    return (
                      <tr key={s.id} className="border-b border-slate-100 last:border-0 align-top">
                        <td className="px-4 py-2 text-slate-700">{s.jobOrder.jobNumber}</td>
                        <td className="px-4 py-2 text-slate-600 max-w-[14rem]">{s.scopeOfWork}</td>
                        <td className="px-4 py-2 text-xs text-slate-500">
                          {quotes.map((q, i) => (
                            <div key={i}>
                              {q.supplier}: {currency(q.amount)}
                            </div>
                          ))}
                          {s.selectedSubcontractor && (
                            <div className="text-emerald-700 mt-0.5">✓ {s.selectedSubcontractor}</div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <Badge value={s.status} />
                        </td>
                        <td className="px-4 py-2">
                          <Badge value={s.paymentRequestStatus} />
                        </td>
                        <td className="px-4 py-2 space-y-1">
                          {s.status === "sourcing" && quotes.length > 0 && (
                            <form action={awardSubcontractor} className="space-y-1">
                              <input type="hidden" name="id" value={s.id} />
                              <select name="selectedSubcontractor" className="text-xs rounded border border-slate-300 px-1.5 py-1 w-full">
                                {quotes.map((q) => (
                                  <option key={q.supplier} value={q.supplier}>
                                    {q.supplier}
                                  </option>
                                ))}
                              </select>
                              <input type="hidden" name="cost" value={quotes[0]?.amount ?? 0} />
                              <button className="text-xs bg-slate-900 text-white rounded px-2 py-1">Award</button>
                            </form>
                          )}
                          {s.status === "awarded" && (
                            <form action={updateSubcontractorStatus}>
                              <input type="hidden" name="id" value={s.id} />
                              <input type="hidden" name="status" value="completed" />
                              <button className="text-xs text-emerald-700 hover:underline">Mark Completed</button>
                            </form>
                          )}
                          {s.status === "completed" && s.paymentRequestStatus === "none" && (
                            <form action={requestSubcontractorPayment}>
                              <input type="hidden" name="id" value={s.id} />
                              <button className="text-xs text-sky-700 hover:underline">Request Payment</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
