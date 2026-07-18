"use client";

import { useState } from "react";
import { advanceStage } from "@/app/job-orders/actions";
import { Field, inputClass, Button } from "@/components/ui";
import { STAGES, STAGE_LABELS } from "@/lib/constants";

const NOTES_LABEL: Record<string, string> = {
  qc: "QC Inspection Checklist notes",
  delivery: "Proof-of-Delivery (POD) reference / notes",
  installation: "Installation Acceptance notes",
  back_job: "Back Job / Concern Report notes",
};

export default function StageAdvanceForm({ jobOrderId, defaultStage }: { jobOrderId: string; defaultStage: string }) {
  const [stage, setStage] = useState(defaultStage);

  return (
    <form action={advanceStage}>
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <Field label="Move to stage">
        <select name="stage" value={stage} onChange={(e) => setStage(e.target.value)} className={inputClass}>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <Field label={NOTES_LABEL[stage] ?? "Notes"}>
        <textarea name="notes" rows={2} className={inputClass} />
      </Field>
      <Field label="Attachments (comma separated file names)">
        <input name="attachments" placeholder="qc-checklist.pdf" className={inputClass} />
      </Field>
      <Button>Update Stage</Button>
    </form>
  );
}
