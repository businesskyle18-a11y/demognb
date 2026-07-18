import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </Card>
  );
}

const BADGE_COLORS: Record<string, string> = {
  // generic
  open: "bg-amber-100 text-amber-800",
  pending: "bg-amber-100 text-amber-800",
  draft: "bg-slate-100 text-slate-700",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  paid: "bg-emerald-100 text-emerald-800",
  partial: "bg-amber-100 text-amber-800",
  sent: "bg-sky-100 text-sky-800",
  accepted: "bg-emerald-100 text-emerald-800",
  released: "bg-emerald-100 text-emerald-800",
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-100 text-slate-500",
  available: "bg-emerald-100 text-emerald-800",
  maintenance: "bg-rose-100 text-rose-800",
  closed: "bg-slate-200 text-slate-600",
  n_a: "bg-slate-100 text-slate-500",
  posted: "bg-sky-100 text-sky-800",
  applied: "bg-slate-100 text-slate-700",
  shortlisted: "bg-sky-100 text-sky-800",
  interview: "bg-indigo-100 text-indigo-800",
  selected: "bg-emerald-100 text-emerald-800",
  offer: "bg-purple-100 text-purple-800",
  onboarded: "bg-emerald-100 text-emerald-800",
  disbursed: "bg-emerald-100 text-emerald-800",
  reviewed: "bg-sky-100 text-sky-800",
  issued: "bg-sky-100 text-sky-800",
  receiving: "bg-amber-100 text-amber-800",
  filled: "bg-emerald-100 text-emerald-800",
  accredited: "bg-emerald-100 text-emerald-800",
};

export function Badge({ value }: { value: string }) {
  const key = value.replace(/\//g, "_");
  const color = BADGE_COLORS[key] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${color}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "submit",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  type?: "submit" | "button";
}) {
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  }[variant];
  return (
    <button type={type} className={`px-3 py-1.5 rounded-md text-sm font-medium ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "secondary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
  }[variant];
  return (
    <Link href={href} className={`px-3 py-1.5 rounded-md text-sm font-medium inline-block ${styles}`}>
      {children}
    </Link>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="text-sm text-slate-400 py-8 text-center">{text}</div>;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400";
