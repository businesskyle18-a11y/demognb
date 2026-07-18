"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createUser(formData: FormData) {
  await prisma.user.create({
    data: {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? "SALES") as never,
      department: String(formData.get("department") ?? ""),
      position: String(formData.get("position") ?? ""),
    },
  });
  revalidatePath("/admin");
}

export async function updateUserStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await prisma.user.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
}

export async function updateUserRole(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!id || !role) return;
  await prisma.user.update({ where: { id }, data: { role: role as never } });
  revalidatePath("/admin");
}

export async function updateApprovalCeiling(formData: FormData) {
  const value = String(formData.get("value") ?? "");
  if (!value) return;
  await prisma.setting.upsert({
    where: { key: "quotation_approval_ceiling" },
    update: { value },
    create: { key: "quotation_approval_ceiling", value },
  });
  revalidatePath("/admin");
  revalidatePath("/quotations");
}
