import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Structured CSV export matching what an external accountant needs for BIR filing.
// Exact field mapping to be confirmed with the accountant before go-live (see spec §10).
export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") ?? undefined;

  const entries = await prisma.payrollEntry.findMany({
    where: period ? { period } : undefined,
    include: { employee: { include: { user: true } } },
    orderBy: { period: "desc" },
  });

  const header = [
    "Employee Name",
    "Position",
    "Department",
    "Period",
    "Base Pay",
    "SSS",
    "PhilHealth",
    "Pag-IBIG",
    "Net Pay",
    "Status",
  ];

  const rows = entries.map((e) => {
    const deductions: { label: string; amount: number }[] = JSON.parse(e.deductions || "[]");
    const find = (label: string) => deductions.find((d) => d.label === label)?.amount ?? 0;
    return [
      e.employee.user.name,
      e.employee.position,
      e.employee.department,
      e.period,
      e.basePay.toFixed(2),
      find("SSS").toFixed(2),
      find("PhilHealth").toFixed(2),
      find("Pag-IBIG").toFixed(2),
      e.netPay.toFixed(2),
      e.status,
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="gnb-payroll-bir-export${period ? `-${period}` : ""}.csv"`,
    },
  });
}
