"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";

export async function advanceStage(formData: FormData) {
  const jobOrderId = String(formData.get("jobOrderId") ?? "");
  const stage = String(formData.get("stage") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const attachments = String(formData.get("attachments") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const user = await getActingUser();
  if (!jobOrderId || !stage || !user) return;

  await prisma.$transaction([
    prisma.jobOrder.update({ where: { id: jobOrderId }, data: { currentStage: stage } }),
    prisma.stageEvent.create({
      data: {
        jobOrderId,
        stage,
        userId: user.id,
        notes,
        attachments: JSON.stringify(attachments),
      },
    }),
  ]);

  revalidatePath(`/job-orders/${jobOrderId}`);
  revalidatePath("/job-orders");
  revalidatePath("/");
}

export async function createMaterialRequest(formData: FormData) {
  const jobOrderId = String(formData.get("jobOrderId") ?? "");
  const user = await getActingUser();
  if (!jobOrderId || !user) return;

  const itemNames = formData.getAll("item[]").map(String);
  const qtys = formData.getAll("qty[]").map(Number);

  const items = await Promise.all(
    itemNames
      .map((item, i) => ({ item, qty: qtys[i] || 0 }))
      .filter((it) => it.item.trim() !== "")
      .map(async (it) => {
        const invItem = await prisma.inventoryItem.findFirst({ where: { name: it.item } });
        return { ...it, availableStock: invItem?.qtyOnHand ?? 0, status: "pending" };
      })
  );

  if (items.length === 0) return;

  await prisma.materialRequest.create({
    data: {
      jobOrderId,
      requestedById: user.id,
      items: JSON.stringify(items),
      status: "pending",
    },
  });

  revalidatePath(`/job-orders/${jobOrderId}`);
}

export async function releaseMaterialRequest(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const jobOrderId = String(formData.get("jobOrderId") ?? "");
  const user = await getActingUser();
  const mr = await prisma.materialRequest.findUnique({ where: { id } });
  if (!mr || !user) return;

  const items: { item: string; qty: number; availableStock: number; status: string }[] = JSON.parse(mr.items);
  let allReleased = true;

  for (const it of items) {
    const invItem = await prisma.inventoryItem.findFirst({ where: { name: it.item } });
    if (invItem && invItem.qtyOnHand >= it.qty) {
      await prisma.$transaction([
        prisma.inventoryItem.update({ where: { id: invItem.id }, data: { qtyOnHand: { decrement: it.qty } } }),
        prisma.inventoryTransaction.create({
          data: { itemId: invItem.id, type: "out", qty: it.qty, relatedRequestId: mr.id, userId: user.id },
        }),
      ]);
      it.status = "released";
    } else {
      it.status = "insufficient_stock";
      allReleased = false;
    }
  }

  await prisma.materialRequest.update({
    where: { id },
    data: { items: JSON.stringify(items), status: allReleased ? "released" : "partially_released" },
  });

  revalidatePath(`/job-orders/${jobOrderId}`);
  revalidatePath("/inventory");
}

export async function postFieldUpdate(formData: FormData) {
  const jobOrderId = String(formData.get("jobOrderId") ?? "");
  const stage = String(formData.get("stage") ?? "");
  const statusLabel = String(formData.get("statusLabel") ?? "");
  const photoUrl = String(formData.get("photoUrl") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const user = await getActingUser();
  if (!jobOrderId || !stage || !statusLabel || !user) return;

  await prisma.fieldUpdate.create({
    data: { jobOrderId, stage, statusLabel, photoUrl, notes, userId: user.id },
  });

  revalidatePath(`/job-orders/${jobOrderId}`);
  revalidatePath("/field-tracking");
  revalidatePath("/");
}
