"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";

function jsonList(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Cost sheets
// ---------------------------------------------------------------------------

export async function createCostSheet(formData: FormData) {
  const jobOrderId = String(formData.get("jobOrderId") ?? "");
  if (!jobOrderId) return;

  await prisma.costSheet.create({
    data: {
      jobOrderId,
      estimatedMaterials: Number(formData.get("estimatedMaterials") ?? 0),
      estimatedLabor: Number(formData.get("estimatedLabor") ?? 0),
      estimatedSubcon: Number(formData.get("estimatedSubcon") ?? 0),
      approvalStatus: "pending",
    },
  });
  revalidatePath("/accounting");
}

export async function decideCostSheet(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const user = await getActingUser();
  if (!id || !decision || !user) return;
  await prisma.costSheet.update({
    where: { id },
    data: { approvalStatus: decision, budgetApprovedById: user.id },
  });
  revalidatePath("/accounting");
}

// ---------------------------------------------------------------------------
// Disbursement vouchers
// ---------------------------------------------------------------------------

export async function createDisbursementVoucher(formData: FormData) {
  const user = await getActingUser();
  if (!user) return;
  await prisma.disbursementVoucher.create({
    data: {
      supplierOrPayee: String(formData.get("supplierOrPayee") ?? ""),
      amount: Number(formData.get("amount") ?? 0),
      purpose: String(formData.get("purpose") ?? ""),
      supportingDocs: JSON.stringify(jsonList(String(formData.get("supportingDocs") ?? ""))),
      preparedById: user.id,
      status: "pending",
    },
  });
  revalidatePath("/accounting");
}

export async function decideDisbursementVoucher(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const user = await getActingUser();
  if (!id || !decision || !user) return;
  await prisma.disbursementVoucher.update({
    where: { id },
    data: { status: decision, approvedById: decision === "approved" ? user.id : undefined },
  });
  revalidatePath("/accounting");
}

// ---------------------------------------------------------------------------
// Invoices / AR
// ---------------------------------------------------------------------------

export async function createInvoice(formData: FormData) {
  const jobOrderId = String(formData.get("jobOrderId") ?? "");
  if (!jobOrderId) return;

  const jobOrder = await prisma.jobOrder.findUnique({ where: { id: jobOrderId }, include: { quotation: true } });
  if (!jobOrder) return;

  const descriptions = formData.getAll("description[]").map(String);
  const qtys = formData.getAll("qty[]").map(Number);
  const unitPrices = formData.getAll("unitPrice[]").map(Number);
  const lineItems = descriptions
    .map((description, i) => ({ description, qty: qtys[i] || 0, unitPrice: unitPrices[i] || 0 }))
    .filter((li) => li.description.trim() !== "");
  const total = lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);

  const invoice = await prisma.invoice.create({
    data: {
      jobOrderId,
      clientId: jobOrder.clientId,
      drReference: String(formData.get("drReference") ?? ""),
      lineItems: JSON.stringify(lineItems),
      total,
      status: "draft",
    },
  });

  await prisma.aRRecord.create({
    data: {
      clientId: jobOrder.clientId,
      jobOrderId,
      invoiceId: invoice.id,
      amount: total,
      dueDate: new Date(Date.now() + 30 * 86400000),
      status: "open",
      paymentHistory: "[]",
    },
  });

  revalidatePath("/accounting");
}

export async function updateInvoiceStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await prisma.invoice.update({ where: { id }, data: { status } });
  revalidatePath("/accounting");
}

export async function recordArPayment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  if (!id || !amount) return;

  const ar = await prisma.aRRecord.findUnique({ where: { id } });
  if (!ar) return;

  const history: { amount: number; date: string }[] = JSON.parse(ar.paymentHistory || "[]");
  history.push({ amount, date: new Date().toISOString() });
  const paid = history.reduce((s, h) => s + h.amount, 0);
  const status = paid >= ar.amount ? "paid" : paid > 0 ? "partial" : "open";

  await prisma.aRRecord.update({
    where: { id },
    data: { paymentHistory: JSON.stringify(history), status },
  });
  revalidatePath("/accounting");
}

// ---------------------------------------------------------------------------
// AP
// ---------------------------------------------------------------------------

export async function createApRecord(formData: FormData) {
  await prisma.aPRecord.create({
    data: {
      supplierName: String(formData.get("supplierName") ?? ""),
      amount: Number(formData.get("amount") ?? 0),
      dueDate: new Date(String(formData.get("dueDate") ?? new Date().toISOString())),
      status: "open",
      paymentHistory: "[]",
    },
  });
  revalidatePath("/accounting");
}

export async function recordApPayment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  if (!id || !amount) return;

  const ap = await prisma.aPRecord.findUnique({ where: { id } });
  if (!ap) return;

  const history: { amount: number; date: string }[] = JSON.parse(ap.paymentHistory || "[]");
  history.push({ amount, date: new Date().toISOString() });
  const paid = history.reduce((s, h) => s + h.amount, 0);
  const status = paid >= ap.amount ? "paid" : paid > 0 ? "partial" : "open";

  await prisma.aPRecord.update({
    where: { id },
    data: { paymentHistory: JSON.stringify(history), status },
  });
  revalidatePath("/accounting");
}

// ---------------------------------------------------------------------------
// Operating expenses
// ---------------------------------------------------------------------------

export async function createOperatingExpense(formData: FormData) {
  const user = await getActingUser();
  if (!user) return;
  await prisma.operatingExpense.create({
    data: {
      type: String(formData.get("type") ?? "variable"),
      category: String(formData.get("category") ?? ""),
      amount: Number(formData.get("amount") ?? 0),
      date: new Date(String(formData.get("date") ?? new Date().toISOString())),
      liquidationDocs: JSON.stringify(jsonList(String(formData.get("liquidationDocs") ?? ""))),
      recordedById: user.id,
    },
  });
  revalidatePath("/accounting");
}

// ---------------------------------------------------------------------------
// Month-end checklist
// ---------------------------------------------------------------------------

export async function toggleChecklistItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const item = await prisma.monthEndChecklistItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.monthEndChecklistItem.update({
    where: { id },
    data: { done: !item.done, doneAt: !item.done ? new Date() : null },
  });
  revalidatePath("/accounting");
}
