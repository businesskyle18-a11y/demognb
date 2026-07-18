import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "gnb_acting_user";

/**
 * Demo-only "auth": the acting user is whoever is picked in the role switcher,
 * stored in a cookie. Phase 2+ replaces this with real Supabase auth.
 */
export async function getActingUser() {
  const store = await cookies();
  const id = store.get(COOKIE_NAME)?.value;

  if (id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) return user;
  }

  const fallback = await prisma.user.findFirst({
    where: { role: "MANAGEMENT" },
    orderBy: { createdAt: "asc" },
  });
  return fallback;
}

export async function setActingUser(userId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, userId, { path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export { COOKIE_NAME };
