"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";

async function getApprovalCeiling(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: "quotation_approval_ceiling" } });
  return setting ? Number(setting.value) : 150000;
}

export async function createQuotation(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const rfqId = String(formData.get("rfqId") ?? "") || null;
  if (!clientId) return;

  const descriptions = formData.getAll("description[]").map(String);
  const qtys = formData.getAll("qty[]").map(Number);
  const unitPrices = formData.getAll("unitPrice[]").map(Number);

  const lineItems = descriptions
    .map((description, i) => ({ description, qty: qtys[i] || 0, unitPrice: unitPrices[i] || 0 }))
    .filter((li) => li.description.trim() !== "");

  const subtotal = lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
  const discount = Number(formData.get("discount") ?? 0);
  const total = subtotal - discount;

  const ceiling = await getApprovalCeiling();
  const requiresApproval = total > ceiling;

  await prisma.quotation.create({
    data: {
      clientId,
      rfqId,
      lineItems: JSON.stringify(lineItems),
      subtotal,
      discount,
      total,
      requiresApproval,
      approvalStatus: requiresApproval ? "pending" : "n/a",
      status: "draft",
    },
  });

  if (rfqId) {
    await prisma.rfq.update({ where: { id: rfqId }, data: { status: "quoted" } });
  }

  revalidatePath("/quotations");
  revalidatePath("/rfqs");
}

export async function updateQuotationStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await prisma.quotation.update({
    where: { id },
    data: { status, sentDate: status === "sent" ? new Date() : undefined },
  });
  revalidatePath("/quotations");
}

export async function decideQuotationApproval(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? ""); // approved | rejected
  const user = await getActingUser();
  if (!id || !decision || !user) return;

  await prisma.quotation.update({
    where: { id },
    data: { approvalStatus: decision, approvedById: user.id },
  });
  revalidatePath("/quotations");
}

export async function createJobOrderFromQuotation(formData: FormData) {
  const quotationId = String(formData.get("quotationId") ?? "");
  const user = await getActingUser();
  if (!quotationId || !user) return;

  const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!quotation) return;
  if (quotation.requiresApproval && quotation.approvalStatus !== "approved") return;

  const count = await prisma.jobOrder.count();
  const jobNumber = `JO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const jobOrder = await prisma.jobOrder.create({
    data: {
      quotationId: quotation.id,
      clientId: quotation.clientId,
      jobNumber,
      projectDetails: `Auto-generated from quotation ${quotation.id}.`,
      createdById: user.id,
      currentStage: "created",
    },
  });

  await prisma.stageEvent.create({
    data: {
      jobOrderId: jobOrder.id,
      stage: "created",
      userId: user.id,
      notes: "Job Order created from accepted quotation.",
    },
  });

  revalidatePath("/quotations");
  revalidatePath("/job-orders");
}
