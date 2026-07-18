import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { PageHeader, StatTile, Card, Badge, EmptyState } from "@/components/ui";
import { currency, formatDateTime, STAGE_LABELS } from "@/lib/constants";

export default async function DashboardPage() {
  const user = await getActingUser();

  const [
    openLeads,
    pendingQuotations,
    jobOrders,
    lowStockItems,
    arOpen,
    apOpen,
    recentFieldUpdates,
    opex,
  ] = await Promise.all([
    prisma.lead.findMany({ where: { status: { notIn: ["converted", "lost"] } }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.quotation.findMany({ where: { approvalStatus: "pending" }, include: { client: true } }),
    prisma.jobOrder.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } }),
    prisma.inventoryItem.findMany(),
    prisma.aRRecord.findMany({ where: { status: { in: ["open", "partial"] } } }),
    prisma.aPRecord.findMany({ where: { status: { in: ["open", "partial"] } } }),
    prisma.fieldUpdate.findMany({
      include: { jobOrder: true, user: true },
      orderBy: { timestamp: "desc" },
      take: 5,
    }),
    prisma.operatingExpense.findMany(),
  ]);

  const lowStock = lowStockItems.filter((i) => i.qtyOnHand <= i.reorderPoint);
  const arTotal = arOpen.reduce((s, r) => s + r.amount, 0);
  const apTotal = apOpen.reduce((s, r) => s + r.amount, 0);
  const opexTotal = opex.reduce((s, e) => s + e.amount, 0);
  const cashSnapshot = arTotal - apTotal - opexTotal;

  const stageCount: Record<string, number> = {};
  for (const jo of jobOrders) {
    stageCount[jo.currentStage] = (stageCount[jo.currentStage] ?? 0) + 1;
  }

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name.split(" ")[0]}`}
        subtitle="Company-wide snapshot across Sales, Operations, Accounting, and Inventory."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatTile label="Open Leads" value={openLeads.length} />
        <StatTile label="Quotations Pending Approval" value={pendingQuotations.length} />
        <StatTile label="Active Job Orders" value={jobOrders.filter((j) => j.currentStage !== "closed").length} />
        <StatTile label="Low Stock Alerts" value={lowStock.length} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatTile label="Open AR" value={currency(arTotal)} hint={`${arOpen.length} record(s)`} />
        <StatTile label="Open AP" value={currency(apTotal)} hint={`${apOpen.length} record(s)`} />
        <StatTile
          label="Cash Flow Snapshot"
          value={currency(cashSnapshot)}
          hint="AR − AP − recorded opex"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1">
          <div className="font-medium text-sm mb-3">Job Orders by Stage</div>
          <div className="space-y-2">
            {Object.entries(STAGE_LABELS).map(([stage, label]) => (
              <div key={stage} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-medium">{stageCount[stage] ?? 0}</span>
              </div>
            ))}
          </div>
          <Link href="/job-orders" className="text-xs text-slate-500 hover:underline mt-3 inline-block">
            View Job Order board →
          </Link>
        </Card>

        <Card className="p-4 lg:col-span-1">
          <div className="font-medium text-sm mb-3">Pending Quotation Approvals</div>
          {pendingQuotations.length === 0 ? (
            <EmptyState text="Nothing pending." />
          ) : (
            <div className="space-y-2">
              {pendingQuotations.map((q) => (
                <Link
                  key={q.id}
                  href="/quotations"
                  className="flex items-center justify-between text-sm hover:bg-slate-50 -mx-2 px-2 py-1 rounded"
                >
                  <span className="text-slate-700">{q.client.companyName}</span>
                  <span className="font-medium">{currency(q.total)}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 lg:col-span-1">
          <div className="font-medium text-sm mb-3">Low Stock Alerts</div>
          {lowStock.length === 0 ? (
            <EmptyState text="All items above reorder point." />
          ) : (
            <div className="space-y-2">
              {lowStock.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{i.name}</span>
                  <Badge value={`${i.qtyOnHand}/${i.reorderPoint} ${i.unit}`} />
                </div>
              ))}
            </div>
          )}
          <Link href="/inventory" className="text-xs text-slate-500 hover:underline mt-3 inline-block">
            View inventory →
          </Link>
        </Card>
      </div>

      <Card className="p-4 mt-4">
        <div className="font-medium text-sm mb-3">Live Field Update Feed</div>
        {recentFieldUpdates.length === 0 ? (
          <EmptyState text="No field updates yet." />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentFieldUpdates.map((f) => (
              <div key={f.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <Link href={`/job-orders/${f.jobOrderId}`} className="font-medium text-slate-800 hover:underline">
                    {f.jobOrder.jobNumber}
                  </Link>
                  <span className="text-slate-500"> · {f.user.name} · {f.notes || "—"}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge value={f.statusLabel} />
                  <span className="text-slate-400 text-xs">{formatDateTime(f.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
