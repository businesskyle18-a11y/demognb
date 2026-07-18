import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, EmptyState, Field, inputClass, Button } from "@/components/ui";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import { createClient, updateAccreditationStatus } from "./actions";

const ACCRED_STATUSES = ["pending", "accredited", "rejected"];

export default async function ClientsPage() {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "sales")) return <Restricted moduleLabel="Clients" />;

  const clients = await prisma.client.findMany({
    include: { _count: { select: { jobOrders: true } } },
    orderBy: { companyName: "asc" },
  });

  return (
    <div>
      <PageHeader title="Clients" subtitle="Accreditation status and job history per client." />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1 h-fit">
          <div className="font-medium text-sm mb-3">Add Client Directly</div>
          <form action={createClient}>
            <Field label="Company name">
              <input name="companyName" required className={inputClass} />
            </Field>
            <Field label="Contact person">
              <input name="contactPerson" required className={inputClass} />
            </Field>
            <Field label="Contact info">
              <input name="contactInfo" required className={inputClass} />
            </Field>
            <Field label="Accreditation docs (comma separated)">
              <input name="docs" placeholder="BIR 2303.pdf, SEC Reg.pdf" className={inputClass} />
            </Field>
            <Button>Add Client</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2 overflow-x-auto">
          {clients.length === 0 ? (
            <EmptyState text="No clients yet." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2">Docs</th>
                  <th className="px-4 py-2">Job Orders</th>
                  <th className="px-4 py-2">Accreditation</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const docs: string[] = JSON.parse(c.accreditationDocs || "[]");
                  return (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 font-medium text-slate-800">{c.companyName}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {c.contactPerson}
                        <div className="text-xs text-slate-400">{c.contactInfo}</div>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">{docs.length ? docs.join(", ") : "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{c._count.jobOrders}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Badge value={c.accreditationStatus} />
                          {user.role === "MANAGEMENT" || user.role === "SALES" ? (
                            <form action={updateAccreditationStatus}>
                              <input type="hidden" name="id" value={c.id} />
                              <AutoSubmitSelect
                                name="status"
                                defaultValue={c.accreditationStatus}
                                options={ACCRED_STATUSES}
                              />
                            </form>
                          ) : null}
                        </div>
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
