export const ROLES = [
  "SALES",
  "PRODUCTION",
  "PRINTING_OPERATOR",
  "QC",
  "DELIVERY",
  "INSTALLATION",
  "ACCOUNTING",
  "HR_ADMIN",
  "PURCHASING",
  "WAREHOUSE",
  "MANAGEMENT",
] as const;

export type RoleName = (typeof ROLES)[number];

export const ROLE_LABELS: Record<RoleName, string> = {
  SALES: "Sales Personnel",
  PRODUCTION: "Production Personnel",
  PRINTING_OPERATOR: "Printing Operator",
  QC: "QC Personnel",
  DELIVERY: "Delivery Personnel",
  INSTALLATION: "Installation Team",
  ACCOUNTING: "Accounting Personnel",
  HR_ADMIN: "HR/Admin Personnel",
  PURCHASING: "Purchasing Personnel",
  WAREHOUSE: "Warehouse/Tool Custodian",
  MANAGEMENT: "Management/President",
};

export const STAGES = [
  "created",
  "printing",
  "production",
  "qc",
  "delivery",
  "installation",
  "back_job",
  "closed",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  created: "Created",
  printing: "Printing",
  production: "Production",
  qc: "QC",
  delivery: "Delivery",
  installation: "Installation",
  back_job: "Back Job",
  closed: "Closed",
};

// module key -> roles allowed to access (MANAGEMENT always has access, enforced separately)
export const MODULE_ACCESS: Record<string, RoleName[]> = {
  dashboard: [...ROLES],
  sales: ["SALES"],
  "job-orders": ["SALES", "PRODUCTION", "PRINTING_OPERATOR", "QC", "DELIVERY", "INSTALLATION"],
  "field-tracking": ["DELIVERY", "INSTALLATION"],
  inventory: ["WAREHOUSE", "PRODUCTION", "PURCHASING"],
  tools: ["WAREHOUSE"],
  purchasing: ["PURCHASING", "ACCOUNTING"],
  accounting: ["ACCOUNTING"],
  hr: ["HR_ADMIN"],
  payroll: ["HR_ADMIN", "ACCOUNTING"],
  admin: [],
};

export function canAccess(role: RoleName, moduleKey: string): boolean {
  if (role === "MANAGEMENT") return true;
  const allowed = MODULE_ACCESS[moduleKey];
  if (!allowed) return true;
  return allowed.includes(role);
}

export function currency(n: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export type LineItem = { description: string; qty: number; unitPrice: number };

export function lineItemsTotal(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
}
