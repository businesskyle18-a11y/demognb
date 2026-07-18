export type NavItem = {
  href: string;
  label: string;
  moduleKey: string;
  group: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", moduleKey: "dashboard", group: "" },
  { href: "/leads", label: "Leads", moduleKey: "sales", group: "Sales" },
  { href: "/clients", label: "Clients", moduleKey: "sales", group: "Sales" },
  { href: "/rfqs", label: "RFQs", moduleKey: "sales", group: "Sales" },
  { href: "/quotations", label: "Quotations", moduleKey: "sales", group: "Sales" },
  { href: "/job-orders", label: "Job Orders", moduleKey: "job-orders", group: "Operations" },
  { href: "/field-tracking", label: "Field Tracking", moduleKey: "field-tracking", group: "Operations" },
  { href: "/inventory", label: "Inventory", moduleKey: "inventory", group: "Warehouse" },
  { href: "/tools", label: "Tool/Equipment", moduleKey: "tools", group: "Warehouse" },
  { href: "/purchasing", label: "Purchasing", moduleKey: "purchasing", group: "Purchasing" },
  { href: "/accounting", label: "Accounting", moduleKey: "accounting", group: "Accounting" },
  { href: "/hr", label: "HR", moduleKey: "hr", group: "HR" },
  { href: "/payroll", label: "Payroll", moduleKey: "payroll", group: "HR" },
  { href: "/admin", label: "Admin", moduleKey: "admin", group: "" },
];
