import { cn } from "@/lib/utils";
import type { Payer, Confidence } from "@/lib/rules-engine";

const PAYER_META: Record<Payer, { label: string; className: string }> = {
  medicare: { label: "Medicare", className: "bg-medicare-soft text-medicare border-medicare/25" },
  sponsor: { label: "Sponsor", className: "bg-sponsor-soft text-sponsor border-sponsor/25" },
  patient: { label: "Patient", className: "bg-patient-soft text-patient border-patient/25" },
  unassigned: {
    label: "Unassigned",
    className: "bg-compliance-amber-soft text-compliance-amber border-compliance-amber/30",
  },
};

/**
 * Payer tag — the product's signature visual. Colour is never the only
 * signal: the text label always accompanies it (WCAG 2.1 AA, §4.5).
 */
export function PayerTag({ payer, className }: { payer: Payer; className?: string }) {
  const meta = PAYER_META[payer];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        meta.className,
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

const CONFIDENCE_META: Record<Confidence, { label: string; className: string }> = {
  high: { label: "High confidence", className: "text-grid-teal" },
  medium: { label: "Medium confidence", className: "text-compliance-amber" },
  low: { label: "Needs review", className: "text-compliance-amber" },
};

export function ConfidenceBadge({
  confidence,
  needsReview,
  className,
}: {
  confidence: Confidence;
  needsReview?: boolean;
  className?: string;
}) {
  const meta = CONFIDENCE_META[confidence];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", meta.className, className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {needsReview && confidence !== "low" ? `${meta.label} · review` : meta.label}
    </span>
  );
}

export function AiTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-grid-teal/30 bg-grid-teal-soft px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-grid-teal uppercase",
        className,
      )}
    >
      AI-suggested
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-secondary text-muted-foreground border-border",
    in_review: "bg-compliance-amber-soft text-compliance-amber border-compliance-amber/30",
    submitted: "bg-compliance-amber-soft text-compliance-amber border-compliance-amber/30",
    approved: "bg-grid-teal-soft text-grid-teal border-grid-teal/30",
    superseded: "bg-muted text-muted-foreground border-border",
  };
  const label: Record<string, string> = {
    draft: "Draft",
    in_review: "In review",
    submitted: "Submitted for approval",
    approved: "Approved",
    superseded: "Superseded",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium",
        map[status] ?? map["draft"],
      )}
    >
      {label[status] ?? status}
    </span>
  );
}
