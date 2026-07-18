"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createTool(formData: FormData) {
  await prisma.toolEquipment.create({
    data: {
      name: String(formData.get("name") ?? ""),
      tagId: String(formData.get("tagId") ?? ""),
      conditionNotes: String(formData.get("conditionNotes") ?? ""),
      status: "available",
    },
  });
  revalidatePath("/tools");
}

export async function releaseTool(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const assignedToId = String(formData.get("assignedToId") ?? "");
  if (!id || !assignedToId) return;
  await prisma.toolEquipment.update({
    where: { id },
    data: { status: "released", assignedToId },
  });
  revalidatePath("/tools");
}

export async function returnTool(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const conditionNotes = String(formData.get("conditionNotes") ?? "");
  if (!id) return;
  await prisma.toolEquipment.update({
    where: { id },
    data: { status: "available", assignedToId: null, conditionNotes, lastInspectionDate: new Date() },
  });
  revalidatePath("/tools");
}

export async function requestRepair(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const conditionNotes = String(formData.get("conditionNotes") ?? "");
  if (!id) return;
  await prisma.toolEquipment.update({
    where: { id },
    data: { status: "maintenance", conditionNotes },
  });
  revalidatePath("/tools");
}

export async function markInspected(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.toolEquipment.update({ where: { id }, data: { lastInspectionDate: new Date() } });
  revalidatePath("/tools");
}
