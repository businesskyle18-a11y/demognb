"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";

export async function createRequestToPurchase(formData: FormData) {
  const user = await getActingUser();
  if (!user) return;
  const item = String(formData.get("item") ?? "");
  const qty = Number(formData.get("qty") ?? 0);
  if (!item || !qty) return;

  await prisma.requestToPurchase.create({
    data: {
      sourceType: String(formData.get("sourceType") ?? "inventory"),
      requestedById: user.id,
      items: JSON.stringify([{ item, qty, notes: String(formData.get("notes") ?? "") }]),
      status: "pending",
    },
  });
  revalidatePath("/purchasing");
}

export async function issuePurchaseOrder(formData: FormData) {
  const requestToPurchaseId = String(formData.get("requestToPurchaseId") ?? "");
  const supplierName = String(formData.get("supplierName") ?? "");
  const unitPrice = Number(formData.get("unitPrice") ?? 0);
  if (!requestToPurchaseId || !supplierName) return;

  const rtp = await prisma.requestToPurchase.findUnique({ where: { id: requestToPurchaseId } });
  if (!rtp) return;
  const items: { item: string; qty: number; notes: string }[] = JSON.parse(rtp.items);
  const poItems = items.map((it) => ({ item: it.item, qty: it.qty, unitPrice }));
  const totalAmount = poItems.reduce((s, it) => s + it.qty * it.unitPrice, 0);

  await prisma.$transaction([
    prisma.purchaseOrder.create({
      data: {
        supplierName,
        requestToPurchaseId,
        items: JSON.stringify(poItems),
        status: "issued",
        totalAmount,
        issuedDate: new Date(),
      },
    }),
    prisma.requestToPurchase.update({ where: { id: requestToPurchaseId }, data: { status: "po_issued" } }),
  ]);

  revalidatePath("/purchasing");
}

export async function receivePurchaseOrder(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const user = await getActingUser();
  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { requestToPurchase: true } });
  if (!po || !user) return;

  const items: { item: string; qty: number; unitPrice: number }[] = JSON.parse(po.items);
  for (const it of items) {
    const invItem = await prisma.inventoryItem.findFirst({ where: { name: it.item } });
    if (invItem) {
      await prisma.$transaction([
        prisma.inventoryItem.update({ where: { id: invItem.id }, data: { qtyOnHand: { increment: it.qty } } }),
        prisma.inventoryTransaction.create({
          data: { itemId: invItem.id, type: "in", qty: it.qty, userId: user.id },
        }),
      ]);
    }
  }

  await prisma.purchaseOrder.update({ where: { id }, data: { status: "received" } });
  if (po.requestToPurchaseId) {
    await prisma.requestToPurchase.update({ where: { id: po.requestToPurchaseId }, data: { status: "closed" } });
  }

  revalidatePath("/purchasing");
  revalidatePath("/inventory");
}

export async function requestPoFunds(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const user = await getActingUser();
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po || !user) return;

  await prisma.disbursementVoucher.create({
    data: {
      supplierOrPayee: po.supplierName,
      amount: po.totalAmount,
      purpose: `Funds request for PO ${po.id}`,
      relatedPoId: po.id,
      preparedById: user.id,
      status: "pending",
    },
  });

  revalidatePath("/purchasing");
  revalidatePath("/accounting");
}

// ---------------------------------------------------------------------------
// Subcontractor flow
// ---------------------------------------------------------------------------

export async function createSubcontractorWorkOrder(formData: FormData) {
  const jobOrderId = String(formData.get("jobOrderId") ?? "");
  const scopeOfWork = String(formData.get("scopeOfWork") ?? "");
  if (!jobOrderId || !scopeOfWork) return;

  const suppliers = formData.getAll("supplier[]").map(String);
  const amounts = formData.getAll("amount[]").map(Number);
  const quotationsReceived = suppliers
    .map((supplier, i) => ({ supplier, amount: amounts[i] || 0 }))
    .filter((q) => q.supplier.trim() !== "");

  await prisma.subcontractorWorkOrder.create({
    data: {
      jobOrderId,
      scopeOfWork,
      quotationsReceived: JSON.stringify(quotationsReceived),
      timeline: String(formData.get("timeline") ?? ""),
      status: "sourcing",
    },
  });
  revalidatePath("/purchasing");
}

export async function awardSubcontractor(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const selectedSubcontractor = String(formData.get("selectedSubcontractor") ?? "");
  const cost = Number(formData.get("cost") ?? 0);
  if (!id || !selectedSubcontractor) return;

  await prisma.subcontractorWorkOrder.update({
    where: { id },
    data: { selectedSubcontractor, cost, status: "awarded" },
  });
  revalidatePath("/purchasing");
}

export async function updateSubcontractorStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await prisma.subcontractorWorkOrder.update({ where: { id }, data: { status } });
  revalidatePath("/purchasing");
}

export async function requestSubcontractorPayment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const user = await getActingUser();
  const swo = await prisma.subcontractorWorkOrder.findUnique({ where: { id } });
  if (!swo || !user) return;

  await prisma.$transaction([
    prisma.subcontractorWorkOrder.update({ where: { id }, data: { paymentRequestStatus: "requested" } }),
    prisma.disbursementVoucher.create({
      data: {
        supplierOrPayee: swo.selectedSubcontractor || "Subcontractor",
        amount: swo.cost,
        purpose: `Subcontractor payment for work order ${swo.id}`,
        preparedById: user.id,
        status: "pending",
      },
    }),
  ]);

  revalidatePath("/purchasing");
  revalidatePath("/accounting");
}
