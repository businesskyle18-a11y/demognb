"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";

export async function createLead(formData: FormData) {
  const user = await getActingUser();
  if (!user) return;

  await prisma.lead.create({
    data: {
      companyName: String(formData.get("companyName") ?? ""),
      contactPerson: String(formData.get("contactPerson") ?? ""),
      contactInfo: String(formData.get("contactInfo") ?? ""),
      source: String(formData.get("source") ?? "direct"),
      notes: String(formData.get("notes") ?? ""),
      ownerId: user.id,
    },
  });

  revalidatePath("/leads");
}

export async function updateLeadStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await prisma.lead.update({ where: { id }, data: { status } });
  revalidatePath("/leads");
}

/** Accreditation checklist step: converts a lead into a Client accreditation record. */
export async function accreditLead(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return;

  let clientId = lead.clientId;
  if (!clientId) {
    const client = await prisma.client.create({
      data: {
        companyName: lead.companyName,
        contactPerson: lead.contactPerson,
        contactInfo: lead.contactInfo,
        accreditationDocs: JSON.stringify(["BIR 2303.pdf", "SEC/DTI Registration.pdf"]),
        accreditationStatus: "accredited",
      },
    });
    clientId = client.id;
  } else {
    await prisma.client.update({ where: { id: clientId }, data: { accreditationStatus: "accredited" } });
  }

  await prisma.lead.update({
    where: { id },
    data: { clientId, status: "accredited" },
  });

  revalidatePath("/leads");
  revalidatePath("/clients");
}
