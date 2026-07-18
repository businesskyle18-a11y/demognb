"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";

export async function createInventoryItem(formData: FormData) {
  await prisma.inventoryItem.create({
    data: {
      sku: String(formData.get("sku") ?? ""),
      name: String(formData.get("name") ?? ""),
      category: String(formData.get("category") ?? ""),
      unit: String(formData.get("unit") ?? "pcs"),
      qtyOnHand: Number(formData.get("qtyOnHand") ?? 0),
      reorderPoint: Number(formData.get("reorderPoint") ?? 0),
      location: String(formData.get("location") ?? ""),
    },
  });
  revalidatePath("/inventory");
}

export async function recordInventoryTransaction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const type = String(formData.get("type") ?? "in");
  const qty = Number(formData.get("qty") ?? 0);
  const user = await getActingUser();
  if (!itemId || !qty || !user) return;

  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) return;
  if (type === "out" && item.qtyOnHand < qty) return;

  await prisma.$transaction([
    prisma.inventoryItem.update({
      where: { id: itemId },
      data: { qtyOnHand: type === "in" ? { increment: qty } : { decrement: qty } },
    }),
    prisma.inventoryTransaction.create({
      data: { itemId, type, qty, userId: user.id },
    }),
  ]);

  revalidatePath("/inventory");
}

export async function createRestockRequest(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const qty = Number(formData.get("qty") ?? 0);
  const user = await getActingUser();
  if (!itemId || !qty || !user) return;

  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) return;

  await prisma.requestToPurchase.create({
    data: {
      sourceType: "inventory",
      sourceId: itemId,
      requestedById: user.id,
      items: JSON.stringify([{ item: item.name, qty, notes: "Restock request from Inventory" }]),
      status: "pending",
    },
  });

  revalidatePath("/inventory");
  revalidatePath("/purchasing");
}
