import Link from "next/link";
import type { User } from "@/generated/prisma";
import RoleSwitcher from "@/components/RoleSwitcher";
import { NAV_ITEMS } from "@/components/nav-items";
import { canAccess, ROLE_LABELS, type RoleName } from "@/lib/constants";

export default function AppShell({
  children,
  actingUser,
  allUsers,
}: {
  children: React.ReactNode;
  actingUser: User | null;
  allUsers: User[];
}) {
  if (!actingUser) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <h1 className="text-xl font-semibold mb-2">No users found</h1>
        <p className="text-slate-600">
          Run <code className="bg-slate-200 px-1 rounded">npm run db:seed</code> to load demo data.
        </p>
      </div>
    );
  }

  const role = actingUser.role as RoleName;
  const visibleItems = NAV_ITEMS.filter((item) => canAccess(role, item.moduleKey));

  const groups: Record<string, typeof NAV_ITEMS> = {};
  for (const item of visibleItems) {
    const key = item.group || "";
    groups[key] = groups[key] ? [...groups[key], item] : [item];
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="font-bold text-sm tracking-wide">GNB DYNAMICS</div>
          <div className="text-[11px] text-slate-400">Unified Business Platform</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group || "top"} className="mb-3">
              {group && (
                <div className="px-4 pb-1 pt-2 text-[10px] uppercase tracking-wider text-slate-500">
                  {group}
                </div>
              )}
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-1.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500">
          Demo MVP — Phase 1 skeleton
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 bg-slate-900 text-white flex items-center justify-between px-4 border-b border-slate-800">
          <div className="text-sm text-slate-300">
            <span className="font-medium text-white">{actingUser.name}</span>
            <span className="text-slate-500"> · {ROLE_LABELS[role] ?? role}</span>
          </div>
          <RoleSwitcher
            users={allUsers.map((u) => ({ id: u.id, name: u.name, role: u.role, position: u.position }))}
            currentUserId={actingUser.id}
          />
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
