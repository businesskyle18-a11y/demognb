"use server";

import { revalidatePath } from "next/cache";
import { setActingUser } from "@/lib/auth";

export async function switchActingUser(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  await setActingUser(userId);
  revalidatePath("/", "layout");
}
