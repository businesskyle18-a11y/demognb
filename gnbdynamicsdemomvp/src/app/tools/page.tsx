import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess, formatDate } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, EmptyState, Field, inputClass, Button } from "@/components/ui";
import { createTool, releaseTool, returnTool, requestRepair, markInspected } from "./actions";

export default async function ToolsPage() {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "tools")) return <Restricted moduleLabel="Tool/Equipment" />;

  const [tools, users] = await Promise.all([
    prisma.toolEquipment.findMany({ include: { assignedTo: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Tool/Equipment Register" subtitle="Tagging, release/return log with condition check, inspection, repair requests." />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1 h-fit">
          <div className="font-medium text-sm mb-3">Tag New Tool</div>
          <form action={createTool}>
            <Field label="Name">
              <input name="name" required className={inputClass} />
            </Field>
            <Field label="Tag ID">
              <input name="tagId" required placeholder="TL-0006" className={inputClass} />
            </Field>
            <Field label="Condition notes">
              <input name="conditionNotes" className={inputClass} />
            </Field>
            <Button>Add Tool</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2 overflow-x-auto">
          {tools.length === 0 ? (
            <EmptyState text="No tools registered yet." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2">Tag</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Assigned To</th>
                  <th className="px-4 py-2">Last Inspection</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 align-top">
                    <td className="px-4 py-2 text-slate-500">{t.tagId}</td>
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {t.name}
                      {t.conditionNotes && <div className="text-xs text-slate-400">{t.conditionNotes}</div>}
                    </td>
                    <td className="px-4 py-2">
                      <Badge value={t.status} />
                    </td>
                    <td className="px-4 py-2 text-slate-600">{t.assignedTo?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {t.lastInspectionDate ? formatDate(t.lastInspectionDate) : "—"}
                    </td>
                    <td className="px-4 py-2 space-y-1.5">
                      {t.status === "available" && (
                        <form action={releaseTool} className="flex gap-1">
                          <input type="hidden" name="id" value={t.id} />
                          <select name="assignedToId" className="text-xs rounded border border-slate-300 px-1 py-1">
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                          <button className="text-xs bg-slate-900 text-white rounded px-2 py-1">Release</button>
                        </form>
                      )}
                      {t.status === "released" && (
                        <form action={returnTool} className="flex gap-1">
                          <input type="hidden" name="id" value={t.id} />
                          <input name="conditionNotes" placeholder="condition on return" className="text-xs rounded border border-slate-300 px-1.5 py-1 w-32" />
                          <button className="text-xs bg-slate-900 text-white rounded px-2 py-1">Return</button>
                        </form>
                      )}
                      {t.status !== "maintenance" && (
                        <form action={requestRepair} className="flex gap-1">
                          <input type="hidden" name="id" value={t.id} />
                          <input name="conditionNotes" placeholder="issue" className="text-xs rounded border border-slate-300 px-1.5 py-1 w-24" />
                          <button className="text-xs text-rose-700 hover:underline whitespace-nowrap">Repair</button>
                        </form>
                      )}
                      <form action={markInspected}>
                        <input type="hidden" name="id" value={t.id} />
                        <button className="text-xs text-sky-700 hover:underline">Mark inspected today</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
