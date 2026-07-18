import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess, formatDate } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, EmptyState, Field, inputClass, Button } from "@/components/ui";
import { TabNav } from "@/components/TabNav";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import {
  createMemoOrSop,
  createManpowerRequest,
  decideManpowerRequest,
  createJobPosting,
  createApplicant,
  updateApplicantStatus,
} from "./actions";

const TABS = [
  { key: "directory", label: "Employee Directory" },
  { key: "sops", label: "SOP/Memo Repository" },
  { key: "hiring", label: "Hiring Pipeline" },
];

const APPLICANT_STATUSES = [
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "background_check",
  "offer",
  "onboarded",
  "rejected",
];

export default async function HrPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "hr")) return <Restricted moduleLabel="HR" />;
  const { tab = "directory" } = await searchParams;
  const canApprove = user.role === "MANAGEMENT";

  const [employees, sops, manpowerRequests, jobPostings] = await Promise.all([
    prisma.employee.findMany({ include: { user: true }, orderBy: { department: "asc" } }),
    prisma.memoOrSop.findMany({ orderBy: { effectiveDate: "desc" } }),
    prisma.manpowerRequest.findMany({ include: { approvedBy: true, jobPostings: true }, orderBy: { createdAt: "desc" } }),
    prisma.jobPosting.findMany({ include: { manpowerRequest: true, applicants: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader title="HR" subtitle="Employee directory, SOP/memo repository, hiring pipeline." />
      <TabNav base="/hr" tabs={TABS} active={tab} />

      {tab === "directory" && (
        <Card className="overflow-x-auto">
          {employees.length === 0 ? (
            <EmptyState text="No employees yet." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Position</th>
                  <th className="px-4 py-2">Department</th>
                  <th className="px-4 py-2">Date Hired</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Assigned SOPs</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const sopList: string[] = JSON.parse(e.assignedSops || "[]");
                  return (
                    <tr key={e.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 font-medium text-slate-800">{e.user.name}</td>
                      <td className="px-4 py-2 text-slate-600">{e.position}</td>
                      <td className="px-4 py-2 text-slate-600">{e.department}</td>
                      <td className="px-4 py-2 text-slate-500">{formatDate(e.dateHired)}</td>
                      <td className="px-4 py-2">
                        <Badge value={e.employmentStatus} />
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">{sopList.join(", ") || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "sops" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-1 h-fit">
            <div className="font-medium text-sm mb-3">New Memo / SOP</div>
            <form action={createMemoOrSop}>
              <Field label="Title">
                <input name="title" required className={inputClass} />
              </Field>
              <Field label="Type">
                <select name="type" className={inputClass}>
                  <option value="memo">Memo</option>
                  <option value="work_instruction">Work Instruction</option>
                  <option value="process">Process</option>
                  <option value="procedure">Procedure</option>
                </select>
              </Field>
              <Field label="Department">
                <input name="department" required className={inputClass} />
              </Field>
              <Field label="Assigned positions (comma separated)">
                <input name="assignedPositions" className={inputClass} />
              </Field>
              <Field label="File URL">
                <input name="fileUrl" placeholder="https://…" className={inputClass} />
              </Field>
              <Button>Publish</Button>
            </form>
          </Card>
          <Card className="lg:col-span-2 overflow-x-auto">
            {sops.length === 0 ? (
              <EmptyState text="No memos or SOPs yet." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Department</th>
                    <th className="px-4 py-2">Positions</th>
                    <th className="px-4 py-2">Effective</th>
                  </tr>
                </thead>
                <tbody>
                  {sops.map((s) => {
                    const positions: string[] = JSON.parse(s.assignedPositions || "[]");
                    return (
                      <tr key={s.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-2 font-medium text-slate-800">{s.title}</td>
                        <td className="px-4 py-2">
                          <Badge value={s.type} />
                        </td>
                        <td className="px-4 py-2 text-slate-600">{s.department}</td>
                        <td className="px-4 py-2 text-xs text-slate-500">{positions.join(", ") || "—"}</td>
                        <td className="px-4 py-2 text-slate-500">{formatDate(s.effectiveDate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {tab === "hiring" && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="p-4 lg:col-span-1 h-fit">
              <div className="font-medium text-sm mb-3">New Manpower Request</div>
              <form action={createManpowerRequest}>
                <Field label="Requesting department">
                  <input name="requestingDepartment" required className={inputClass} />
                </Field>
                <Field label="Position">
                  <input name="position" required className={inputClass} />
                </Field>
                <Button>Submit Request</Button>
              </form>
            </Card>
            <Card className="lg:col-span-2 overflow-x-auto">
              {manpowerRequests.length === 0 ? (
                <EmptyState text="No manpower requests yet." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                      <th className="px-4 py-2">Department</th>
                      <th className="px-4 py-2">Position</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {manpowerRequests.map((m) => (
                      <tr key={m.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-2 text-slate-700">{m.requestingDepartment}</td>
                        <td className="px-4 py-2 font-medium text-slate-800">{m.position}</td>
                        <td className="px-4 py-2">
                          <Badge value={m.status} />
                        </td>
                        <td className="px-4 py-2 space-y-1">
                          {m.status === "pending" && canApprove && (
                            <div className="flex gap-2">
                              <form action={decideManpowerRequest}>
                                <input type="hidden" name="id" value={m.id} />
                                <input type="hidden" name="decision" value="approved" />
                                <button className="text-xs text-emerald-700 hover:underline">Approve</button>
                              </form>
                              <form action={decideManpowerRequest}>
                                <input type="hidden" name="id" value={m.id} />
                                <input type="hidden" name="decision" value="rejected" />
                                <button className="text-xs text-rose-700 hover:underline">Reject</button>
                              </form>
                            </div>
                          )}
                          {m.status === "approved" && m.jobPostings.length === 0 && (
                            <details>
                              <summary className="text-xs text-sky-700 hover:underline cursor-pointer">Post job →</summary>
                              <form action={createJobPosting} className="mt-1 space-y-1">
                                <input type="hidden" name="manpowerRequestId" value={m.id} />
                                <textarea name="description" placeholder="Job description" rows={2} className="text-xs rounded border border-slate-300 px-1.5 py-1 w-56" />
                                <input name="channels" placeholder="JobStreet, FB" className="text-xs rounded border border-slate-300 px-1.5 py-1 w-56 block" />
                                <button className="text-xs bg-slate-900 text-white rounded px-2 py-1">Post</button>
                              </form>
                            </details>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          <Card className="p-4">
            <div className="font-medium text-sm mb-3">Applicants by Job Posting</div>
            {jobPostings.length === 0 ? (
              <EmptyState text="No job postings yet." />
            ) : (
              <div className="space-y-4">
                {jobPostings.map((jp) => (
                  <div key={jp.id} className="border border-slate-200 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-slate-800">
                        {jp.manpowerRequest.position} <span className="text-slate-400 font-normal">({jp.status})</span>
                      </div>
                    </div>
                    <table className="w-full text-sm mb-2">
                      <tbody>
                        {jp.applicants.map((a) => (
                          <tr key={a.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-1 text-slate-700">{a.name}</td>
                            <td className="py-1 text-xs text-slate-400">{a.contact}</td>
                            <td className="py-1">
                              <form action={updateApplicantStatus}>
                                <input type="hidden" name="id" value={a.id} />
                                <AutoSubmitSelect name="status" defaultValue={a.status} options={APPLICANT_STATUSES} />
                              </form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <form action={createApplicant} className="flex gap-1.5">
                      <input type="hidden" name="jobPostingId" value={jp.id} />
                      <input name="name" placeholder="Applicant name" required className="text-xs rounded border border-slate-300 px-1.5 py-1 flex-1" />
                      <input name="contact" placeholder="Contact" required className="text-xs rounded border border-slate-300 px-1.5 py-1 flex-1" />
                      <button className="text-xs bg-slate-900 text-white rounded px-2 py-1 whitespace-nowrap">Add Applicant</button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
