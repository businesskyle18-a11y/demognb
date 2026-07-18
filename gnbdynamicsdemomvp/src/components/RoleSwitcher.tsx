"use client";

import { useRef } from "react";
import { switchActingUser } from "@/app/actions/session";
import { ROLE_LABELS, type RoleName } from "@/lib/constants";

type UserOption = {
  id: string;
  name: string;
  role: string;
  position: string;
};

export default function RoleSwitcher({
  users,
  currentUserId,
}: {
  users: UserOption[];
  currentUserId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={switchActingUser} className="flex items-center gap-2">
      <label htmlFor="acting-user" className="text-xs text-slate-400 hidden sm:block">
        Acting as
      </label>
      <select
        id="acting-user"
        name="userId"
        defaultValue={currentUserId}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-slate-700 bg-slate-800 text-slate-100 text-sm px-2 py-1.5 max-w-[220px]"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} — {ROLE_LABELS[u.role as RoleName] ?? u.role}
          </option>
        ))}
      </select>
    </form>
  );
}
