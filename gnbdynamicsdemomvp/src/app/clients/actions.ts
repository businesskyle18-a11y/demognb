"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createClient(formData: FormData) {
  await prisma.client.create({
    data: {
      companyName: String(formData.get("companyName") ?? ""),
      contactPerson: String(formData.get("contactPerson") ?? ""),
      contactInfo: String(formData.get("contactInfo") ?? ""),
      accreditationDocs: JSON.stringify(
        String(formData.get("docs") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
      accreditationStatus: "pending",
    },
  });
  revalidatePath("/clients");
}

export async function updateAccreditationStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await prisma.client.update({ where: { id }, data: { accreditationStatus: status } });
  revalidatePath("/clients");
}
