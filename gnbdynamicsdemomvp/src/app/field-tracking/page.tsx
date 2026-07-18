import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess, formatDateTime } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import FieldUpdateForm from "@/components/FieldUpdateForm";

export default async function FieldTrackingPage() {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "field-tracking")) return <Restricted moduleLabel="Field Tracking" />;

  const jobOrders = await prisma.jobOrder.findMany({
    where: { currentStage: { in: ["delivery", "installation"] } },
    include: {
      client: true,
      fieldUpdates: { include: { user: true }, orderBy: { timestamp: "desc" }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Field Tracking"
        subtitle="Post status, photo, and notes from a phone at each delivery/installation checkpoint."
      />

      {jobOrders.length === 0 ? (
        <EmptyState text="No Job Orders currently in Delivery or Installation." />
      ) : (
        <div className="space-y-4">
          {jobOrders.map((jo) => (
            <Card key={jo.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Link href={`/job-orders/${jo.id}`} className="font-semibold text-slate-800 hover:underline">
                    {jo.jobNumber}
                  </Link>
                  <div className="text-xs text-slate-500">{jo.client.companyName}</div>
                </div>
                <Badge value={jo.currentStage} />
              </div>

              {jo.fieldUpdates.length > 0 && (
                <div className="text-xs text-slate-500 mb-3 space-y-1">
                  {jo.fieldUpdates.map((f) => (
                    <div key={f.id}>
                      {formatDateTime(f.timestamp)} · {f.user.name} · {f.statusLabel.replace(/_/g, " ")}
                    </div>
                  ))}
                </div>
              )}

              <FieldUpdateForm jobOrderId={jo.id} defaultStage={jo.currentStage === "installation" ? "installation" : "delivery"} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
