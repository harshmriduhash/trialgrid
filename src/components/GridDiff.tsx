import { PayerTag } from "@/components/PayerTag";
import type { Payer } from "@/lib/rules-engine";

export interface DiffLine {
  procedure_name: string;
  visit_label: string | null;
  payer: Payer;
  cpt_code: string | null;
  modifier: string | null;
  rule_id: string | null;
}

type Change =
  | { kind: "added"; key: string; next: DiffLine }
  | { kind: "removed"; key: string; prev: DiffLine }
  | { kind: "changed"; key: string; prev: DiffLine; next: DiffLine; fields: string[] }
  | { kind: "unchanged"; key: string; next: DiffLine };

function keyOf(line: DiffLine) {
  return `${line.procedure_name.toLowerCase().trim()}::${(line.visit_label ?? "").toLowerCase().trim()}`;
}

export function diffGrids(previous: DiffLine[], next: DiffLine[]): Change[] {
  const prevMap = new Map(previous.map((line) => [keyOf(line), line]));
  const changes: Change[] = [];

  for (const line of next) {
    const key = keyOf(line);
    const prev = prevMap.get(key);
    if (!prev) {
      changes.push({ kind: "added", key, next: line });
      continue;
    }
    prevMap.delete(key);
    const fields: string[] = [];
    if (prev.payer !== line.payer) fields.push("payer");
    if ((prev.cpt_code ?? "") !== (line.cpt_code ?? "")) fields.push("CPT");
    if ((prev.modifier ?? "") !== (line.modifier ?? "")) fields.push("modifier");
    if ((prev.rule_id ?? "") !== (line.rule_id ?? "")) fields.push("rule");
    changes.push(
      fields.length > 0
        ? { kind: "changed", key, prev, next: line, fields }
        : { kind: "unchanged", key, next: line },
    );
  }

  for (const [key, prev] of prevMap) changes.push({ kind: "removed", key, prev });
  return changes;
}

const BADGE: Record<Change["kind"], string> = {
  added: "border-grid-teal/30 bg-grid-teal-soft text-grid-teal",
  removed: "border-destructive/30 bg-destructive/10 text-destructive",
  changed: "border-compliance-amber/30 bg-compliance-amber-soft text-compliance-amber",
  unchanged: "border-border bg-secondary text-muted-foreground",
};

/** Version diff viewer: what changed between two grid versions, and why it matters. */
export function GridDiff({
  previousLabel,
  nextLabel,
  previous,
  next,
}: {
  previousLabel: string;
  nextLabel: string;
  previous: DiffLine[];
  next: DiffLine[];
}) {
  const changes = diffGrids(previous, next);
  const material = changes.filter((change) => change.kind !== "unchanged");
  const counts = {
    added: changes.filter((c) => c.kind === "added").length,
    removed: changes.filter((c) => c.kind === "removed").length,
    changed: changes.filter((c) => c.kind === "changed").length,
    unchanged: changes.filter((c) => c.kind === "unchanged").length,
  };

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {previousLabel} → {nextLabel}
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {counts.added} added · {counts.removed} removed · {counts.changed} reclassified · {counts.unchanged}{" "}
          unchanged
        </p>
      </div>

      {material.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          No material differences between these versions.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {material.map((change) => {
            const line = change.kind === "removed" ? change.prev : change.next;
            return (
              <li key={`${change.kind}-${change.key}`} className="px-5 py-4">
                <div className="flex flex-wrap items-start gap-3">
                  <span
                    className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase ${BADGE[change.kind]}`}
                  >
                    {change.kind}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{line.procedure_name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {line.visit_label ?? "—"} · {line.rule_id ?? "—"}
                    </p>

                    {change.kind === "changed" && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-muted-foreground">{change.fields.join(", ")} changed:</span>
                        <span className="flex items-center gap-2 opacity-60">
                          <PayerTag payer={change.prev.payer} />
                          <span className="font-mono">{change.prev.cpt_code ?? "—"}</span>
                        </span>
                        <span aria-hidden className="text-muted-foreground">
                          →
                        </span>
                        <span className="flex items-center gap-2">
                          <PayerTag payer={change.next.payer} />
                          <span className="font-mono">{change.next.cpt_code ?? "—"}</span>
                        </span>
                      </div>
                    )}

                    {change.kind !== "changed" && (
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <PayerTag payer={line.payer} />
                        <span className="font-mono text-muted-foreground">{line.cpt_code ?? "—"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
