"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createRfq(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return;

  const files = String(formData.get("attachedFiles") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.rfq.create({
    data: {
      clientId,
      specsText: String(formData.get("specsText") ?? ""),
      dimensions: String(formData.get("dimensions") ?? ""),
      quantity: Number(formData.get("quantity") ?? 1),
      ocularRequired: formData.get("ocularRequired") === "on",
      attachedFiles: JSON.stringify(files),
    },
  });

  revalidatePath("/rfqs");
}

export async function updateRfqStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await prisma.rfq.update({ where: { id }, data: { status } });
  revalidatePath("/rfqs");
}
