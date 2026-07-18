import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, EmptyState, Field, inputClass, Button } from "@/components/ui";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import { formatDate } from "@/lib/constants";
import { createRfq, updateRfqStatus } from "./actions";

const STATUS_OPTIONS = ["open", "quoted", "closed"];

export default async function RfqsPage() {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "sales")) return <Restricted moduleLabel="RFQs" />;

  const [rfqs, clients] = await Promise.all([
    prisma.rfq.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } }),
    prisma.client.findMany({ where: { accreditationStatus: "accredited" }, orderBy: { companyName: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="RFQs" subtitle="Request-for-quotation intake with specs and file references." />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1 h-fit">
          <div className="font-medium text-sm mb-3">New RFQ</div>
          {clients.length === 0 ? (
            <p className="text-xs text-slate-500">
              No accredited clients yet — accredit a lead first on the Leads page.
            </p>
          ) : (
            <form action={createRfq}>
              <Field label="Client">
                <select name="clientId" required className={inputClass}>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Specs">
                <textarea name="specsText" rows={3} required className={inputClass} />
              </Field>
              <Field label="Dimensions">
                <input name="dimensions" placeholder="e.g. 10ft x 6ft" className={inputClass} />
              </Field>
              <Field label="Quantity">
                <input name="quantity" type="number" min={1} defaultValue={1} className={inputClass} />
              </Field>
              <Field label="Attached files (comma separated names)">
                <input name="attachedFiles" placeholder="specs.pdf, site-photo.jpg" className={inputClass} />
              </Field>
              <label className="flex items-center gap-2 text-sm mb-3">
                <input type="checkbox" name="ocularRequired" />
                Ocular inspection required
              </label>
              <Button>Add RFQ</Button>
            </form>
          )}
        </Card>

        <Card className="lg:col-span-2 overflow-x-auto">
          {rfqs.length === 0 ? (
            <EmptyState text="No RFQs yet." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Specs</th>
                  <th className="px-4 py-2">Dim / Qty</th>
                  <th className="px-4 py-2">Files</th>
                  <th className="px-4 py-2">Received</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((r) => {
                  const files: string[] = JSON.parse(r.attachedFiles || "[]");
                  return (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 align-top">
                      <td className="px-4 py-2 font-medium text-slate-800">{r.client.companyName}</td>
                      <td className="px-4 py-2 text-slate-600 max-w-xs">
                        {r.specsText}
                        {r.ocularRequired && <div className="text-xs text-amber-700 mt-0.5">Ocular required</div>}
                      </td>
                      <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                        {r.dimensions || "—"} · {r.quantity}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {files.length ? files.map((f) => <div key={f}>📎 {f}</div>) : "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{formatDate(r.receivedDate)}</td>
                      <td className="px-4 py-2">
                        <Badge value={r.status} />
                      </td>
                      <td className="px-4 py-2 space-y-1">
                        <form action={updateRfqStatus}>
                          <input type="hidden" name="id" value={r.id} />
                          <AutoSubmitSelect name="status" defaultValue={r.status} options={STATUS_OPTIONS} />
                        </form>
                        <Link href={`/quotations?rfqId=${r.id}`} className="text-xs text-sky-700 hover:underline block">
                          Build quotation →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
