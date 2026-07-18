import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess, ROLES, ROLE_LABELS, type RoleName } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, Field, inputClass, Button } from "@/components/ui";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import { createUser, updateUserStatus, updateUserRole, updateApprovalCeiling } from "./actions";

export default async function AdminPage() {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "admin")) return <Restricted moduleLabel="Admin" />;

  const [users, ceilingSetting] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.setting.findUnique({ where: { key: "quotation_approval_ceiling" } }),
  ]);

  return (
    <div>
      <PageHeader title="Admin" subtitle="User management, role assignment, and system settings." />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-4 lg:col-span-1 h-fit">
          <div className="font-medium text-sm mb-3">Add User</div>
          <form action={createUser}>
            <Field label="Name">
              <input name="name" required className={inputClass} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" required className={inputClass} />
            </Field>
            <Field label="Role">
              <select name="role" className={inputClass}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Department">
              <input name="department" required className={inputClass} />
            </Field>
            <Field label="Position">
              <input name="position" required className={inputClass} />
            </Field>
            <Button>Add User</Button>
          </form>
        </Card>

        <Card className="p-4 lg:col-span-1 h-fit">
          <div className="font-medium text-sm mb-3">Quotation Approval Ceiling</div>
          <p className="text-xs text-slate-500 mb-3">
            Quotations above this total require Management approval before a Job Order can be created.
          </p>
          <form action={updateApprovalCeiling}>
            <Field label="Ceiling (₱)">
              <input name="value" type="number" step="any" defaultValue={ceilingSetting?.value ?? "150000"} className={inputClass} />
            </Field>
            <Button>Save</Button>
          </form>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Position</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-2 text-slate-500 text-xs">{u.email}</td>
                <td className="px-4 py-2">
                  <form action={updateUserRole}>
                    <input type="hidden" name="id" value={u.id} />
                    <AutoSubmitSelect name="role" defaultValue={u.role} options={ROLES as unknown as string[]} />
                  </form>
                </td>
                <td className="px-4 py-2 text-slate-600">{u.department}</td>
                <td className="px-4 py-2 text-slate-600">{u.position}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Badge value={u.status} />
                    <form action={updateUserStatus}>
                      <input type="hidden" name="id" value={u.id} />
                      <AutoSubmitSelect name="status" defaultValue={u.status} options={["active", "inactive"]} />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
