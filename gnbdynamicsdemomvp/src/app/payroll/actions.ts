"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";

export async function createPayrollEntry(formData: FormData) {
  const employeeId = String(formData.get("employeeId") ?? "");
  const period = String(formData.get("period") ?? "");
  const basePay = Number(formData.get("basePay") ?? 0);
  const sss = Number(formData.get("sss") ?? 0);
  const philhealth = Number(formData.get("philhealth") ?? 0);
  const pagibig = Number(formData.get("pagibig") ?? 0);
  if (!employeeId || !period) return;

  const deductions = [
    { label: "SSS", amount: sss },
    { label: "PhilHealth", amount: philhealth },
    { label: "Pag-IBIG", amount: pagibig },
  ];
  const netPay = basePay - sss - philhealth - pagibig;

  await prisma.payrollEntry.create({
    data: {
      employeeId,
      period,
      basePay,
      deductions: JSON.stringify(deductions),
      netPay,
      status: "draft",
    },
  });
  revalidatePath("/payroll");
}

export async function reviewPayrollEntry(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const user = await getActingUser();
  if (!id || !user) return;
  await prisma.payrollEntry.update({ where: { id }, data: { status: "reviewed", reviewedById: user.id } });
  revalidatePath("/payroll");
}

export async function disbursePayrollEntry(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.payrollEntry.update({ where: { id }, data: { status: "disbursed" } });
  revalidatePath("/payroll");
}
