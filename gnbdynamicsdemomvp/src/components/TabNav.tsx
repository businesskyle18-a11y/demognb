import Link from "next/link";

export function TabNav({
  base,
  tabs,
  active,
}: {
  base: string;
  tabs: { key: string; label: string }[];
  active: string;
}) {
  return (
    <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={`${base}?tab=${t.key}`}
          className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${
            active === t.key
              ? "border-slate-900 text-slate-900 font-medium"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
