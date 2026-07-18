import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess, STAGES, STAGE_LABELS } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/constants";

export default async function JobOrdersPage() {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "job-orders")) return <Restricted moduleLabel="Job Orders" />;

  const jobOrders = await prisma.jobOrder.findMany({
    include: { client: true, fieldUpdates: { orderBy: { timestamp: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  const byStage: Record<string, typeof jobOrders> = {};
  for (const stage of STAGES) byStage[stage] = [];
  for (const jo of jobOrders) {
    (byStage[jo.currentStage] ??= []).push(jo);
  }

  return (
    <div>
      <PageHeader title="Job Orders" subtitle="Queue by stage — Printing → Production → QC → Delivery → Installation → Back Job." />

      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((stage) => (
          <div key={stage} className="w-64 shrink-0">
            <div className="text-xs font-semibold uppercase text-slate-500 mb-2 flex items-center justify-between">
              <span>{STAGE_LABELS[stage]}</span>
              <span className="text-slate-400">{byStage[stage].length}</span>
            </div>
            <div className="space-y-2">
              {byStage[stage].length === 0 ? (
                <div className="text-xs text-slate-300 border border-dashed border-slate-200 rounded-md p-3 text-center">
                  empty
                </div>
              ) : (
                byStage[stage].map((jo) => (
                  <Link key={jo.id} href={`/job-orders/${jo.id}`}>
                    <Card className="p-3 hover:border-slate-400 transition-colors">
                      <div className="text-sm font-semibold text-slate-800">{jo.jobNumber}</div>
                      <div className="text-xs text-slate-500">{jo.client.companyName}</div>
                      <div className="text-xs text-slate-400 mt-1 line-clamp-2">{jo.projectDetails}</div>
                      {jo.fieldUpdates[0] && (
                        <div className="text-[11px] text-sky-700 mt-1">
                          ● {jo.fieldUpdates[0].statusLabel.replace(/_/g, " ")}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1">{formatDate(jo.createdAt)}</div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {jobOrders.length === 0 && <EmptyState text="No Job Orders yet — create one from an accepted quotation." />}
    </div>
  );
}
