import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, EmptyState, Field, inputClass, Button } from "@/components/ui";
import { formatDate } from "@/lib/constants";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import { createLead, updateLeadStatus, accreditLead } from "./actions";

const STATUS_OPTIONS = ["new", "qualifying", "accredited", "converted", "lost"];

export default async function LeadsPage() {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "sales")) return <Restricted moduleLabel="Leads" />;

  const leads = await prisma.lead.findMany({
    include: { owner: true, client: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Leads" subtitle="Lead intake through to accreditation and conversion." />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1 h-fit">
          <div className="font-medium text-sm mb-3">New Lead</div>
          <form action={createLead}>
            <Field label="Company name">
              <input name="companyName" required className={inputClass} />
            </Field>
            <Field label="Contact person">
              <input name="contactPerson" required className={inputClass} />
            </Field>
            <Field label="Contact info (email / phone)">
              <input name="contactInfo" required className={inputClass} />
            </Field>
            <Field label="Source">
              <select name="source" className={inputClass}>
                <option value="referral">Referral</option>
                <option value="online">Online</option>
                <option value="direct">Direct</option>
              </select>
            </Field>
            <Field label="Notes">
              <textarea name="notes" rows={3} className={inputClass} />
            </Field>
            <Button>Add Lead</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2 overflow-x-auto">
          {leads.length === 0 ? (
            <EmptyState text="No leads yet." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2">Owner</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-medium text-slate-800">{lead.companyName}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {lead.contactPerson}
                      <div className="text-xs text-slate-400">{lead.contactInfo}</div>
                    </td>
                    <td className="px-4 py-2 capitalize text-slate-600">{lead.source}</td>
                    <td className="px-4 py-2 text-slate-600">{lead.owner.name}</td>
                    <td className="px-4 py-2">
                      <Badge value={lead.status} />
                    </td>
                    <td className="px-4 py-2 text-slate-500">{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <form action={updateLeadStatus}>
                          <input type="hidden" name="id" value={lead.id} />
                          <AutoSubmitSelect name="status" defaultValue={lead.status} options={STATUS_OPTIONS} />
                        </form>
                        {lead.status !== "accredited" && lead.status !== "converted" && (
                          <form action={accreditLead}>
                            <input type="hidden" name="id" value={lead.id} />
                            <button className="text-xs text-sky-700 hover:underline whitespace-nowrap">
                              Run accreditation
                            </button>
                          </form>
                        )}
                        {lead.client && (
                          <span className="text-xs text-emerald-700">✓ client linked</span>
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
    </div>
  );
}
