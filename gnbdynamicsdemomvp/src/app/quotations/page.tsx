import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess, currency, formatDate } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import QuotationBuilderForm from "@/components/QuotationBuilderForm";
import { updateQuotationStatus, decideQuotationApproval, createJobOrderFromQuotation } from "./actions";

const STATUS_OPTIONS = ["draft", "sent", "accepted", "rejected"];

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ rfqId?: string }>;
}) {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "sales")) return <Restricted moduleLabel="Quotations" />;
  const { rfqId } = await searchParams;

  const [quotations, clients, rfqs, ceilingSetting] = await Promise.all([
    prisma.quotation.findMany({
      include: { client: true, rfq: true, approvedBy: true, jobOrders: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({ where: { accreditationStatus: "accredited" }, orderBy: { companyName: "asc" } }),
    prisma.rfq.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.setting.findUnique({ where: { key: "quotation_approval_ceiling" } }),
  ]);

  const ceiling = ceilingSetting ? Number(ceilingSetting.value) : 150000;
  const canApprove = user.role === "MANAGEMENT";

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle={`Quotation builder with price-ceiling approval logic (ceiling: ${currency(ceiling)}).`}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1 h-fit">
          <div className="font-medium text-sm mb-3">Build Quotation</div>
          {clients.length === 0 ? (
            <p className="text-xs text-slate-500">No accredited clients yet.</p>
          ) : (
            <QuotationBuilderForm
              clients={clients.map((c) => ({ id: c.id, companyName: c.companyName }))}
              rfqs={rfqs.map((r) => ({ id: r.id, clientId: r.clientId, specsText: r.specsText }))}
              defaultRfqId={rfqId}
              ceiling={ceiling}
            />
          )}
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-x-auto">
            {quotations.length === 0 ? (
              <EmptyState text="No quotations yet." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Total</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Approval</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => {
                    const canCreateJobOrder =
                      q.status === "accepted" &&
                      (!q.requiresApproval || q.approvalStatus === "approved") &&
                      q.jobOrders.length === 0;
                    return (
                      <tr key={q.id} className="border-b border-slate-100 last:border-0 align-top">
                        <td className="px-4 py-2 font-medium text-slate-800">{q.client.companyName}</td>
                        <td className="px-4 py-2 text-slate-700">{currency(q.total)}</td>
                        <td className="px-4 py-2">
                          <form action={updateQuotationStatus}>
                            <input type="hidden" name="id" value={q.id} />
                            <AutoSubmitSelect name="status" defaultValue={q.status} options={STATUS_OPTIONS} />
                          </form>
                        </td>
                        <td className="px-4 py-2">
                          {q.requiresApproval ? (
                            <div className="space-y-1">
                              <Badge value={q.approvalStatus} />
                              {q.approvalStatus === "pending" && canApprove && (
                                <div className="flex gap-2 mt-1">
                                  <form action={decideQuotationApproval}>
                                    <input type="hidden" name="id" value={q.id} />
                                    <input type="hidden" name="decision" value="approved" />
                                    <button className="text-xs text-emerald-700 hover:underline">Approve</button>
                                  </form>
                                  <form action={decideQuotationApproval}>
                                    <input type="hidden" name="id" value={q.id} />
                                    <input type="hidden" name="decision" value="rejected" />
                                    <button className="text-xs text-rose-700 hover:underline">Reject</button>
                                  </form>
                                </div>
                              )}
                              {q.approvedBy && (
                                <div className="text-[11px] text-slate-400">by {q.approvedBy.name}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">not required</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{formatDate(q.createdAt)}</td>
                        <td className="px-4 py-2">
                          {canCreateJobOrder && (
                            <form action={createJobOrderFromQuotation}>
                              <input type="hidden" name="quotationId" value={q.id} />
                              <button className="text-xs bg-slate-900 text-white rounded px-2 py-1 whitespace-nowrap">
                                Create Job Order
                              </button>
                            </form>
                          )}
                          {q.jobOrders.length > 0 && (
                            <span className="text-xs text-emerald-700">→ {q.jobOrders[0].jobNumber}</span>
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
      </div>
    </div>
  );
}
