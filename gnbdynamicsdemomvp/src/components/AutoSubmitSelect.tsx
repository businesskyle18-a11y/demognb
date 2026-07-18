"use client";

import { useRef } from "react";

export default function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  className,
}: {
  name: string;
  defaultValue: string;
  options: string[];
  className?: string;
}) {
  const ref = useRef<HTMLSelectElement>(null);
  return (
    <select
      ref={ref}
      name={name}
      defaultValue={defaultValue}
      onChange={() => ref.current?.form?.requestSubmit()}
      className={className ?? "text-xs rounded border border-slate-300 px-1.5 py-1"}
    >
      {options.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
