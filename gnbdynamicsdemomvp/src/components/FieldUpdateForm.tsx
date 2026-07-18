"use client";

import { useState } from "react";
import { postFieldUpdate } from "@/app/job-orders/actions";
import { Field, inputClass, Button } from "@/components/ui";

const STATUS_OPTIONS = ["dispatched", "en_route", "arrived", "in_progress", "completed", "issue"];

export default function FieldUpdateForm({
  jobOrderId,
  defaultStage,
}: {
  jobOrderId: string;
  defaultStage: "dispatch" | "delivery" | "installation";
}) {
  const [preview, setPreview] = useState("");

  return (
    <form action={postFieldUpdate} className="space-y-0">
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <Field label="Checkpoint">
        <select name="stage" defaultValue={defaultStage} className={inputClass}>
          <option value="dispatch">Dispatch</option>
          <option value="delivery">Delivery</option>
          <option value="installation">Installation</option>
        </select>
      </Field>
      <Field label="Status">
        <select name="statusLabel" className={inputClass}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Photo URL (camera capture placeholder for the demo)">
        <input
          name="photoUrl"
          placeholder="https://…"
          className={inputClass}
          onChange={(e) => setPreview(e.target.value)}
        />
      </Field>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="preview" className="w-full h-28 object-cover rounded-md mb-3 border border-slate-200" />
      )}
      <Field label="Notes">
        <textarea name="notes" rows={2} className={inputClass} />
      </Field>
      <Button>Post Update</Button>
    </form>
  );
}
