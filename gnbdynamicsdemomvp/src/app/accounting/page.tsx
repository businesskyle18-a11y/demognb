import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess, currency, formatDate } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, EmptyState, Field, inputClass, Button } from "@/components/ui";
import { TabNav } from "@/components/TabNav";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import {
  createCostSheet,
  decideCostSheet,
  createDisbursementVoucher,
  decideDisbursementVoucher,
  createInvoice,
  updateInvoiceStatus,
  recordArPayment,
  createApRecord,
  recordApPayment,
  createOperatingExpense,
  toggleChecklistItem,
} from "./actions";

const TABS = [
  { key: "reports", label: "Reports" },
  { key: "cost-sheets", label: "Cost Sheets" },
  { key: "disbursements", label: "Disbursement Vouchers" },
  { key: "invoices", label: "Invoices & AR" },
  { key: "ap", label: "AP" },
  { key: "opex", label: "Operating Expenses" },
  { key: "month-end", label: "Month-End Checklist" },
];

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "accounting")) return <Restricted moduleLabel="Accounting" />;
  const { tab = "reports" } = await searchParams;
  const canApprove = user.role === "MANAGEMENT";

  const [jobOrders, costSheets, dvs, invoices, arRecords, apRecords, opex, checklist] = await Promise.all([
    prisma.jobOrder.findMany({ include: { client: true, costSheet: true }, orderBy: { createdAt: "desc" } }),
    prisma.costSheet.findMany({ include: { jobOrder: { include: { client: true } }, budgetApprovedBy: true }, orderBy: { createdAt: "desc" } }),
    prisma.disbursementVoucher.findMany({ include: { preparedBy: true, approvedBy: true }, orderBy: { createdAt: "desc" } }),
    prisma.invoice.findMany({ include: { client: true, jobOrder: true }, orderBy: { createdAt: "desc" } }),
    prisma.aRRecord.findMany({ include: { client: true, jobOrder: true }, orderBy: { dueDate: "asc" } }),
    prisma.aPRecord.findMany({ include: { jobOrder: true }, orderBy: { dueDate: "asc" } }),
    prisma.operatingExpense.findMany({ include: { recordedBy: true }, orderBy: { date: "desc" } }),
    prisma.monthEndChecklistItem.findMany({ orderBy: { task: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Accounting" subtitle="Full QBO replacement: cost sheets, disbursements, AR/AP, opex, close, reports." />
      <TabNav base="/accounting" tabs={TABS} active={tab} />

      {tab === "reports" && <ReportsTab arRecords={arRecords} apRecords={apRecords} opex={opex} dvs={dvs} costSheets={costSheets} invoices={invoices} />}

      {tab === "cost-sheets" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-1 h-fit">
            <div className="font-medium text-sm mb-3">New Cost Sheet</div>
            <form action={createCostSheet}>
              <Field label="Job Order">
                <select name="jobOrderId" required className={inputClass}>
                  {jobOrders
                    .filter((j) => !j.costSheet)
                    .map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.jobNumber} — {j.client.companyName}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Estimated materials (₱)">
                <input name="estimatedMaterials" type="number" step="any" defaultValue={0} className={inputClass} />
              </Field>
              <Field label="Estimated labor (₱)">
                <input name="estimatedLabor" type="number" step="any" defaultValue={0} className={inputClass} />
              </Field>
              <Field label="Estimated subcontractor (₱)">
                <input name="estimatedSubcon" type="number" step="any" defaultValue={0} className={inputClass} />
              </Field>
              <Button>Submit for Budget Approval</Button>
            </form>
          </Card>
          <Card className="lg:col-span-2 overflow-x-auto">
            {costSheets.length === 0 ? (
              <EmptyState text="No cost sheets yet." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-2">Job Order</th>
                    <th className="px-4 py-2">Materials</th>
                    <th className="px-4 py-2">Labor</th>
                    <th className="px-4 py-2">Subcon</th>
                    <th className="px-4 py-2">Total</th>
                    <th className="px-4 py-2">Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {costSheets.map((cs) => (
                    <tr key={cs.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 font-medium text-slate-800">{cs.jobOrder.jobNumber}</td>
                      <td className="px-4 py-2">{currency(cs.estimatedMaterials)}</td>
                      <td className="px-4 py-2">{currency(cs.estimatedLabor)}</td>
                      <td className="px-4 py-2">{currency(cs.estimatedSubcon)}</td>
                      <td className="px-4 py-2 font-medium">
                        {currency(cs.estimatedMaterials + cs.estimatedLabor + cs.estimatedSubcon)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Badge value={cs.approvalStatus} />
                          {cs.approvalStatus === "pending" && canApprove && (
                            <div className="flex gap-2">
                              <form action={decideCostSheet}>
                                <input type="hidden" name="id" value={cs.id} />
                                <input type="hidden" name="decision" value="approved" />
                                <button className="text-xs text-emerald-700 hover:underline">Approve</button>
                              </form>
                              <form action={decideCostSheet}>
                                <input type="hidden" name="id" value={cs.id} />
                                <input type="hidden" name="decision" value="rejected" />
                                <button className="text-xs text-rose-700 hover:underline">Reject</button>
                              </form>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {tab === "disbursements" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-1 h-fit">
            <div className="font-medium text-sm mb-3">New Disbursement Voucher</div>
            <form action={createDisbursementVoucher}>
              <Field label="Supplier / Payee">
                <input name="supplierOrPayee" required className={inputClass} />
              </Field>
              <Field label="Amount (₱)">
                <input name="amount" type="number" step="any" required className={inputClass} />
              </Field>
              <Field label="Purpose">
                <textarea name="purpose" rows={2} required className={inputClass} />
              </Field>
              <Field label="Supporting docs (comma separated)">
                <input name="supportingDocs" placeholder="PO.pdf, DR.pdf" className={inputClass} />
              </Field>
              <Button>Prepare Voucher</Button>
            </form>
          </Card>
          <Card className="lg:col-span-2 overflow-x-auto">
            {dvs.length === 0 ? (
              <EmptyState text="No disbursement vouchers yet." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-2">Payee</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Purpose</th>
                    <th className="px-4 py-2">Prepared by</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dvs.map((dv) => (
                    <tr key={dv.id} className="border-b border-slate-100 last:border-0 align-top">
                      <td className="px-4 py-2 font-medium text-slate-800">{dv.supplierOrPayee}</td>
                      <td className="px-4 py-2">{currency(dv.amount)}</td>
                      <td className="px-4 py-2 text-slate-600 max-w-xs">{dv.purpose}</td>
                      <td className="px-4 py-2 text-slate-500">{dv.preparedBy.name}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Badge value={dv.status} />
                          {dv.status === "pending" && canApprove && (
                            <form action={decideDisbursementVoucher}>
                              <input type="hidden" name="id" value={dv.id} />
                              <input type="hidden" name="decision" value="approved" />
                              <button className="text-xs text-emerald-700 hover:underline">Approve</button>
                            </form>
                          )}
                          {dv.status === "approved" && (
                            <form action={decideDisbursementVoucher}>
                              <input type="hidden" name="id" value={dv.id} />
                              <input type="hidden" name="decision" value="disbursed" />
                              <button className="text-xs text-sky-700 hover:underline">Mark Disbursed</button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {tab === "invoices" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-1 h-fit">
            <div className="font-medium text-sm mb-3">New Invoice</div>
            <InvoiceForm jobOrders={jobOrders.map((j) => ({ id: j.id, jobNumber: j.jobNumber, companyName: j.client.companyName }))} />
          </Card>
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-x-auto">
              <div className="px-4 pt-3 text-xs font-medium text-slate-500 uppercase">Invoices</div>
              {invoices.length === 0 ? (
                <EmptyState text="No invoices yet." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                      <th className="px-4 py-2">DR Ref</th>
                      <th className="px-4 py-2">Client</th>
                      <th className="px-4 py-2">Job Order</th>
                      <th className="px-4 py-2">Total</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-2 font-medium text-slate-800">{inv.drReference || "—"}</td>
                        <td className="px-4 py-2 text-slate-600">{inv.client.companyName}</td>
                        <td className="px-4 py-2 text-slate-600">{inv.jobOrder.jobNumber}</td>
                        <td className="px-4 py-2">{currency(inv.total)}</td>
                        <td className="px-4 py-2">
                          <form action={updateInvoiceStatus}>
                            <input type="hidden" name="id" value={inv.id} />
                            <AutoSubmitSelect name="status" defaultValue={inv.status} options={["draft", "sent", "paid", "overdue"]} />
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card className="overflow-x-auto">
              <div className="px-4 pt-3 text-xs font-medium text-slate-500 uppercase">Accounts Receivable</div>
              {arRecords.length === 0 ? (
                <EmptyState text="No AR records yet." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                      <th className="px-4 py-2">Client</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Due</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {arRecords.map((ar) => (
                      <tr key={ar.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-2 text-slate-700">{ar.client.companyName}</td>
                        <td className="px-4 py-2">{currency(ar.amount)}</td>
                        <td className="px-4 py-2 text-slate-500">{formatDate(ar.dueDate)}</td>
                        <td className="px-4 py-2">
                          <Badge value={ar.status} />
                        </td>
                        <td className="px-4 py-2">
                          {ar.status !== "paid" && (
                            <form action={recordArPayment} className="flex gap-1">
                              <input type="hidden" name="id" value={ar.id} />
                              <input
                                name="amount"
                                type="number"
                                step="any"
                                placeholder="₱ paid"
                                className="w-20 text-xs rounded border border-slate-300 px-1.5 py-1"
                              />
                              <button className="text-xs bg-slate-900 text-white rounded px-2 py-1">Record</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "ap" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-1 h-fit">
            <div className="font-medium text-sm mb-3">New AP Record</div>
            <form action={createApRecord}>
              <Field label="Supplier">
                <input name="supplierName" required className={inputClass} />
              </Field>
              <Field label="Amount (₱)">
                <input name="amount" type="number" step="any" required className={inputClass} />
              </Field>
              <Field label="Due date">
                <input name="dueDate" type="date" required className={inputClass} />
              </Field>
              <Button>Add AP Record</Button>
            </form>
          </Card>
          <Card className="lg:col-span-2 overflow-x-auto">
            {apRecords.length === 0 ? (
              <EmptyState text="No AP records yet." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-2">Supplier</th>
                    <th className="px-4 py-2">Job Order</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Due</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {apRecords.map((ap) => (
                    <tr key={ap.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 font-medium text-slate-800">{ap.supplierName}</td>
                      <td className="px-4 py-2 text-slate-500">{ap.jobOrder?.jobNumber ?? "—"}</td>
                      <td className="px-4 py-2">{currency(ap.amount)}</td>
                      <td className="px-4 py-2 text-slate-500">{formatDate(ap.dueDate)}</td>
                      <td className="px-4 py-2">
                        <Badge value={ap.status} />
                      </td>
                      <td className="px-4 py-2">
                        {ap.status !== "paid" && (
                          <form action={recordApPayment} className="flex gap-1">
                            <input type="hidden" name="id" value={ap.id} />
                            <input
                              name="amount"
                              type="number"
                              step="any"
                              placeholder="₱ paid"
                              className="w-20 text-xs rounded border border-slate-300 px-1.5 py-1"
                            />
                            <button className="text-xs bg-slate-900 text-white rounded px-2 py-1">Record</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {tab === "opex" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-1 h-fit">
            <div className="font-medium text-sm mb-3">Record Operating Expense</div>
            <form action={createOperatingExpense}>
              <Field label="Type">
                <select name="type" className={inputClass}>
                  <option value="fixed">Fixed</option>
                  <option value="variable">Variable / Petty Cash</option>
                </select>
              </Field>
              <Field label="Category">
                <input name="category" required className={inputClass} />
              </Field>
              <Field label="Amount (₱)">
                <input name="amount" type="number" step="any" required className={inputClass} />
              </Field>
              <Field label="Date">
                <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
              </Field>
              <Field label="Liquidation docs (comma separated)">
                <input name="liquidationDocs" placeholder="receipt.jpg" className={inputClass} />
              </Field>
              <Button>Record Expense</Button>
            </form>
          </Card>
          <Card className="lg:col-span-2 overflow-x-auto">
            {opex.length === 0 ? (
              <EmptyState text="No operating expenses recorded yet." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Recorded by</th>
                  </tr>
                </thead>
                <tbody>
                  {opex.map((e) => (
                    <tr key={e.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 font-medium text-slate-800">{e.category}</td>
                      <td className="px-4 py-2 capitalize text-slate-600">{e.type}</td>
                      <td className="px-4 py-2">{currency(e.amount)}</td>
                      <td className="px-4 py-2 text-slate-500">{formatDate(e.date)}</td>
                      <td className="px-4 py-2 text-slate-500">{e.recordedBy.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {tab === "month-end" && (
        <Card className="p-4 max-w-xl">
          <div className="font-medium text-sm mb-3">Month-End Close Checklist</div>
          {checklist.length === 0 ? (
            <EmptyState text="No checklist items." />
          ) : (
            <div className="space-y-2">
              {checklist.map((item) => (
                <form key={item.id} action={toggleChecklistItem} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                      item.done ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 text-transparent"
                    }`}
                  >
                    ✓
                  </button>
                  <span className={item.done ? "line-through text-slate-400" : "text-slate-700"}>{item.task}</span>
                  <span className="text-xs text-slate-400 ml-auto">{item.period}</span>
                </form>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function InvoiceForm({ jobOrders }: { jobOrders: { id: string; jobNumber: string; companyName: string }[] }) {
  return (
    <form action={createInvoice}>
      <Field label="Job Order">
        <select name="jobOrderId" required className={inputClass}>
          {jobOrders.map((j) => (
            <option key={j.id} value={j.id}>
              {j.jobNumber} — {j.companyName}
            </option>
          ))}
        </select>
      </Field>
      <Field label="DR Reference">
        <input name="drReference" placeholder="DR-10250" className={inputClass} />
      </Field>
      <Field label="Line item description">
        <input name="description[]" required className={inputClass} />
      </Field>
      <div className="flex gap-2">
        <Field label="Qty">
          <input name="qty[]" type="number" step="any" defaultValue={1} className={inputClass} />
        </Field>
        <Field label="Unit price (₱)">
          <input name="unitPrice[]" type="number" step="any" defaultValue={0} className={inputClass} />
        </Field>
      </div>
      <Button>Create Invoice</Button>
    </form>
  );
}

function ReportsTab({
  arRecords,
  apRecords,
  opex,
  dvs,
  costSheets,
  invoices,
}: {
  arRecords: { amount: number; status: string; dueDate: Date; paymentHistory: string; client: { companyName: string } }[];
  apRecords: { amount: number; status: string; dueDate: Date; paymentHistory: string; supplierName: string }[];
  opex: { amount: number }[];
  dvs: { amount: number; status: string }[];
  costSheets: { estimatedMaterials: number; estimatedLabor: number; estimatedSubcon: number; jobOrder: { jobNumber: string } }[];
  invoices: { total: number; jobOrder: { jobNumber: string } }[];
}) {
  const arCollected = arRecords.reduce((s, r) => {
    const history: { amount: number }[] = JSON.parse(r.paymentHistory || "[]");
    return s + history.reduce((a, h) => a + h.amount, 0);
  }, 0);
  const apPaid = apRecords.reduce((s, r) => {
    const history: { amount: number }[] = JSON.parse(r.paymentHistory || "[]");
    return s + history.reduce((a, h) => a + h.amount, 0);
  }, 0);
  const disbursed = dvs.filter((d) => d.status === "disbursed").reduce((s, d) => s + d.amount, 0);
  const opexTotal = opex.reduce((s, e) => s + e.amount, 0);
  const cashIn = arCollected;
  const cashOut = apPaid + disbursed + opexTotal;
  const arOpenTotal = arRecords.filter((r) => r.status !== "paid").reduce((s, r) => s + r.amount, 0);
  const apOpenTotal = apRecords.filter((r) => r.status !== "paid").reduce((s, r) => s + r.amount, 0);

  const budgetVsActual = invoices.map((inv) => {
    const cs = costSheets.find((c) => c.jobOrder.jobNumber === inv.jobOrder.jobNumber);
    const budget = cs ? cs.estimatedMaterials + cs.estimatedLabor + cs.estimatedSubcon : 0;
    return { jobNumber: inv.jobOrder.jobNumber, budget, actual: inv.total, variance: inv.total - budget };
  });

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="font-medium text-sm mb-2">Cash Flow Snapshot</div>
          <Row label="Cash in (AR collected)" value={currency(cashIn)} />
          <Row label="Cash out (AP + DV + Opex)" value={currency(cashOut)} />
          <Row label="Net" value={currency(cashIn - cashOut)} strong />
        </Card>
        <Card className="p-4">
          <div className="font-medium text-sm mb-2">Collection Report</div>
          <Row label="Open AR" value={currency(arOpenTotal)} />
          <Row label="Collected to date" value={currency(arCollected)} />
        </Card>
        <Card className="p-4">
          <div className="font-medium text-sm mb-2">AP Report</div>
          <Row label="Open AP" value={currency(apOpenTotal)} />
          <Row label="Paid to date" value={currency(apPaid)} />
        </Card>
      </div>

      <Card className="p-4 overflow-x-auto">
        <div className="font-medium text-sm mb-3">Budget vs. Actual (by Job Order)</div>
        {budgetVsActual.length === 0 ? (
          <EmptyState text="No invoiced Job Orders yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2">Job Order</th>
                <th className="px-4 py-2">Budget</th>
                <th className="px-4 py-2">Actual (Invoiced)</th>
                <th className="px-4 py-2">Variance</th>
              </tr>
            </thead>
            <tbody>
              {budgetVsActual.map((b) => (
                <tr key={b.jobNumber} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-slate-800">{b.jobNumber}</td>
                  <td className="px-4 py-2">{currency(b.budget)}</td>
                  <td className="px-4 py-2">{currency(b.actual)}</td>
                  <td className={`px-4 py-2 ${b.variance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {currency(b.variance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between text-sm py-0.5 ${strong ? "font-semibold border-t border-slate-200 mt-1 pt-1" : "text-slate-600"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
