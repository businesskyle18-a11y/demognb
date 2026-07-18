import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess, currency, formatDate, formatDateTime, STAGE_LABELS } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import StageAdvanceForm from "@/components/StageAdvanceForm";
import MaterialRequestForm from "@/components/MaterialRequestForm";
import FieldUpdateForm from "@/components/FieldUpdateForm";
import { releaseMaterialRequest } from "../actions";

const OPS_ROLES = ["PRODUCTION", "PRINTING_OPERATOR", "QC", "DELIVERY", "INSTALLATION", "MANAGEMENT"];
const FIELD_ROLES = ["DELIVERY", "INSTALLATION", "MANAGEMENT"];
const WAREHOUSE_ROLES = ["WAREHOUSE", "MANAGEMENT"];

export default async function JobOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "job-orders")) return <Restricted moduleLabel="Job Orders" />;

  const { id } = await params;
  const jobOrder = await prisma.jobOrder.findUnique({
    where: { id },
    include: {
      client: true,
      createdBy: true,
      quotation: true,
      stageEvents: { include: { user: true }, orderBy: { timestamp: "asc" } },
      materialRequests: { include: { requestedBy: true }, orderBy: { createdAt: "desc" } },
      fieldUpdates: { include: { user: true }, orderBy: { timestamp: "desc" } },
      costSheet: true,
      invoices: true,
      arRecords: true,
    },
  });
  if (!jobOrder) notFound();

  return (
    <div>
      <PageHeader
        title={jobOrder.jobNumber}
        subtitle={`${jobOrder.client.companyName} · Notice to Proceed ${formatDate(jobOrder.noticeToProceedDate)} · created by ${jobOrder.createdBy.name}`}
        action={<Badge value={STAGE_LABELS[jobOrder.currentStage] ?? jobOrder.currentStage} />}
      />

      <Card className="p-4 mb-4">
        <div className="text-sm text-slate-700">{jobOrder.projectDetails}</div>
        {jobOrder.quotation && (
          <div className="text-xs text-slate-400 mt-1">
            Linked quotation total: {currency(jobOrder.quotation.total)}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="font-medium text-sm mb-3">Stage History</div>
            {jobOrder.stageEvents.length === 0 ? (
              <EmptyState text="No stage events yet." />
            ) : (
              <ol className="relative border-l border-slate-200 ml-2 space-y-4">
                {jobOrder.stageEvents.map((ev) => {
                  const attachments: string[] = JSON.parse(ev.attachments || "[]");
                  return (
                    <li key={ev.id} className="ml-4">
                      <div className="absolute w-2 h-2 bg-slate-400 rounded-full -left-[4.5px] mt-1.5" />
                      <div className="text-sm font-medium text-slate-800">
                        {STAGE_LABELS[ev.stage] ?? ev.stage}
                      </div>
                      <div className="text-xs text-slate-400">
                        {ev.user.name} · {formatDateTime(ev.timestamp)}
                      </div>
                      {ev.notes && <div className="text-sm text-slate-600 mt-0.5">{ev.notes}</div>}
                      {attachments.length > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {attachments.map((a) => (
                            <span key={a} className="mr-2">
                              📎 {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          {OPS_ROLES.includes(user.role) && (
            <Card className="p-4">
              <div className="font-medium text-sm mb-3">Advance Stage</div>
              <StageAdvanceForm jobOrderId={jobOrder.id} defaultStage={jobOrder.currentStage} />
            </Card>
          )}

          <Card className="p-4">
            <div className="font-medium text-sm mb-3">Live Field Update Feed</div>
            {jobOrder.fieldUpdates.length === 0 ? (
              <EmptyState text="No field updates posted yet." />
            ) : (
              <div className="space-y-3">
                {jobOrder.fieldUpdates.map((f) => (
                  <div key={f.id} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    {f.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.photoUrl} alt="" className="w-16 h-16 object-cover rounded-md border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-slate-100 shrink-0 flex items-center justify-center text-slate-300 text-xs">
                        no photo
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge value={f.statusLabel} />
                        <span className="text-xs text-slate-400 capitalize">{f.stage}</span>
                      </div>
                      <div className="text-sm text-slate-700 mt-0.5">{f.notes || "—"}</div>
                      <div className="text-xs text-slate-400">
                        {f.user.name} · {formatDateTime(f.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {FIELD_ROLES.includes(user.role) && (
            <Card className="p-4">
              <div className="font-medium text-sm mb-3">Post Field Update</div>
              <FieldUpdateForm jobOrderId={jobOrder.id} defaultStage={jobOrder.currentStage === "installation" ? "installation" : "delivery"} />
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="font-medium text-sm mb-3">Material Requests</div>
            {jobOrder.materialRequests.length === 0 ? (
              <EmptyState text="None yet." />
            ) : (
              <div className="space-y-3 mb-3">
                {jobOrder.materialRequests.map((mr) => {
                  const items: { item: string; qty: number; availableStock: number; status: string }[] = JSON.parse(mr.items);
                  return (
                    <div key={mr.id} className="border border-slate-200 rounded-md p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">{mr.requestedBy.name}</span>
                        <Badge value={mr.status} />
                      </div>
                      <ul className="text-xs text-slate-600 space-y-0.5">
                        {items.map((it, i) => (
                          <li key={i} className="flex justify-between">
                            <span>{it.item}</span>
                            <span>
                              {it.qty} ({it.status})
                            </span>
                          </li>
                        ))}
                      </ul>
                      {mr.status === "pending" && WAREHOUSE_ROLES.includes(user.role) && (
                        <form action={releaseMaterialRequest} className="mt-2">
                          <input type="hidden" name="id" value={mr.id} />
                          <input type="hidden" name="jobOrderId" value={jobOrder.id} />
                          <button className="text-xs bg-slate-900 text-white rounded px-2 py-1">
                            Release from Inventory
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {(user.role === "PRODUCTION" || user.role === "MANAGEMENT") && (
              <MaterialRequestForm jobOrderId={jobOrder.id} />
            )}
          </Card>

          <Card className="p-4">
            <div className="font-medium text-sm mb-2">Accounting Snapshot</div>
            {jobOrder.costSheet ? (
              <div className="text-sm text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Cost Sheet</span>
                  <Badge value={jobOrder.costSheet.approvalStatus} />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Materials + Labor + Subcon</span>
                  <span>
                    {currency(
                      jobOrder.costSheet.estimatedMaterials +
                        jobOrder.costSheet.estimatedLabor +
                        jobOrder.costSheet.estimatedSubcon
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">No cost sheet yet.</div>
            )}
            {jobOrder.invoices.length > 0 && (
              <div className="text-sm text-slate-600 mt-2">
                {jobOrder.invoices.map((inv) => (
                  <div key={inv.id} className="flex justify-between">
                    <span>Invoice {inv.drReference}</span>
                    <Badge value={inv.status} />
                  </div>
                ))}
              </div>
            )}
            <Link href="/accounting" className="text-xs text-sky-700 hover:underline mt-2 block">
              Open Accounting →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
