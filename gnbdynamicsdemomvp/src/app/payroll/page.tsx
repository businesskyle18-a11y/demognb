import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess, currency } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, EmptyState, Field, inputClass, Button } from "@/components/ui";
import { createPayrollEntry, reviewPayrollEntry, disbursePayrollEntry } from "./actions";

export default async function PayrollPage() {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "payroll")) return <Restricted moduleLabel="Payroll" />;

  const [entries, employees] = await Promise.all([
    prisma.payrollEntry.findMany({
      include: { employee: { include: { user: true } }, reviewedBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.employee.findMany({ include: { user: true }, orderBy: { department: "asc" } }),
  ]);

  const canReview = user.role === "ACCOUNTING" || user.role === "MANAGEMENT";
  const canCreate = user.role === "HR_ADMIN" || user.role === "MANAGEMENT";

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle="HR worksheet → Accounting review/disbursement → one-click BIR-ready export."
        action={
          <a
            href="/payroll/export"
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
          >
            Export CSV (BIR template)
          </a>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {canCreate && (
          <Card className="p-4 lg:col-span-1 h-fit">
            <div className="font-medium text-sm mb-3">New Payroll Entry</div>
            <form action={createPayrollEntry}>
              <Field label="Employee">
                <select name="employeeId" required className={inputClass}>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.user.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Period">
                <input name="period" placeholder="2026-07-16 to 2026-07-31" required className={inputClass} />
              </Field>
              <Field label="Base pay (₱)">
                <input name="basePay" type="number" step="any" required className={inputClass} />
              </Field>
              <Field label="SSS (₱)">
                <input name="sss" type="number" step="any" defaultValue={450} className={inputClass} />
              </Field>
              <Field label="PhilHealth (₱)">
                <input name="philhealth" type="number" step="any" defaultValue={350} className={inputClass} />
              </Field>
              <Field label="Pag-IBIG (₱)">
                <input name="pagibig" type="number" step="any" defaultValue={100} className={inputClass} />
              </Field>
              <Button>Add to Worksheet</Button>
            </form>
          </Card>
        )}

        <Card className={`overflow-x-auto ${canCreate ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {entries.length === 0 ? (
            <EmptyState text="No payroll entries yet." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2">Employee</th>
                  <th className="px-4 py-2">Period</th>
                  <th className="px-4 py-2">Base Pay</th>
                  <th className="px-4 py-2">Net Pay</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-medium text-slate-800">{e.employee.user.name}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">{e.period}</td>
                    <td className="px-4 py-2">{currency(e.basePay)}</td>
                    <td className="px-4 py-2 font-medium">{currency(e.netPay)}</td>
                    <td className="px-4 py-2">
                      <Badge value={e.status} />
                    </td>
                    <td className="px-4 py-2">
                      {e.status === "draft" && canReview && (
                        <form action={reviewPayrollEntry}>
                          <input type="hidden" name="id" value={e.id} />
                          <button className="text-xs text-sky-700 hover:underline">Review</button>
                        </form>
                      )}
                      {e.status === "reviewed" && canReview && (
                        <form action={disbursePayrollEntry}>
                          <input type="hidden" name="id" value={e.id} />
                          <button className="text-xs text-emerald-700 hover:underline">Mark Disbursed</button>
                        </form>
                      )}
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
