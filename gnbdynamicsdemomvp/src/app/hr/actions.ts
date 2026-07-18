"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";

export async function createMemoOrSop(formData: FormData) {
  await prisma.memoOrSop.create({
    data: {
      title: String(formData.get("title") ?? ""),
      type: String(formData.get("type") ?? "memo"),
      department: String(formData.get("department") ?? ""),
      assignedPositions: JSON.stringify(
        String(formData.get("assignedPositions") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
      fileUrl: String(formData.get("fileUrl") ?? ""),
    },
  });
  revalidatePath("/hr");
}

export async function createManpowerRequest(formData: FormData) {
  await prisma.manpowerRequest.create({
    data: {
      requestingDepartment: String(formData.get("requestingDepartment") ?? ""),
      position: String(formData.get("position") ?? ""),
      status: "pending",
    },
  });
  revalidatePath("/hr");
}

export async function decideManpowerRequest(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const user = await getActingUser();
  if (!id || !decision || !user) return;
  await prisma.manpowerRequest.update({
    where: { id },
    data: { status: decision, approvedById: user.id },
  });
  revalidatePath("/hr");
}

export async function createJobPosting(formData: FormData) {
  const manpowerRequestId = String(formData.get("manpowerRequestId") ?? "");
  if (!manpowerRequestId) return;
  await prisma.jobPosting.create({
    data: {
      manpowerRequestId,
      description: String(formData.get("description") ?? ""),
      channels: JSON.stringify(
        String(formData.get("channels") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
      status: "posted",
    },
  });
  revalidatePath("/hr");
}

export async function createApplicant(formData: FormData) {
  const jobPostingId = String(formData.get("jobPostingId") ?? "");
  if (!jobPostingId) return;
  await prisma.applicant.create({
    data: {
      jobPostingId,
      name: String(formData.get("name") ?? ""),
      contact: String(formData.get("contact") ?? ""),
      status: "applied",
    },
  });
  revalidatePath("/hr");
}

export async function updateApplicantStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await prisma.applicant.update({ where: { id }, data: { status } });
  revalidatePath("/hr");
}
