import type { Payer } from "./rules-engine";

export interface ExportLine {
  position: number;
  procedure_name: string;
  visit_label: string | null;
  frequency: string | null;
  cpt_code: string | null;
  modifier: string | null;
  payer: Payer;
  confidence: string;
  ai_suggested: boolean;
  human_edited: boolean;
  rule_id: string | null;
  rule_citation: string | null;
  rationale: string | null;
}

export interface ExportMeta {
  protocol_number: string;
  title: string;
  phase: string | null;
  sponsor: string | null;
  is_qct: boolean;
  version_number: number;
  status: string;
  rules_version: string;
  approved_at: string | null;
  organization: string;
}

const PAYER_LABEL: Record<Payer, string> = {
  medicare: "Medicare (routine cost)",
  sponsor: "Sponsor (research cost)",
  patient: "Patient",
  unassigned: "Unassigned — needs manual classification",
};

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV shaped for import into Huron / START / IRIS-style billing systems. */
export function buildCsv(meta: ExportMeta, lines: ExportLine[]): string {
  const header = [
    "Protocol Number",
    "Grid Version",
    "Line",
    "Procedure",
    "Visit",
    "Frequency",
    "Payer",
    "CPT Code",
    "Modifier",
    "Confidence",
    "Source",
    "Rule ID",
    "Rule Citation",
  ];
  const rows = lines.map((line, index) =>
    [
      meta.protocol_number,
      `v${meta.version_number}`,
      index + 1,
      line.procedure_name,
      line.visit_label ?? "",
      line.frequency ?? "",
      PAYER_LABEL[line.payer],
      line.cpt_code ?? "",
      line.modifier ?? "",
      line.confidence,
      line.human_edited ? "Human edited" : line.ai_suggested ? "AI drafted, human approved" : "Human entered",
      line.rule_id ?? "",
      line.rule_citation ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadCsv(meta: ExportMeta, lines: ExportLine[]) {
  const blob = new Blob([buildCsv(meta, lines)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${meta.protocol_number}-billing-grid-v${meta.version_number}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] as string,
  );
}

/** Print-to-PDF export. Uses the browser print pipeline — no server round trip. */
export function printGridPdf(meta: ExportMeta, lines: ExportLine[]) {
  const rows = lines
    .map(
      (line, index) => `<tr>
        <td class="num">${index + 1}</td>
        <td>${escapeHtml(line.procedure_name)}</td>
        <td>${escapeHtml(line.visit_label ?? "—")}</td>
        <td>${escapeHtml(PAYER_LABEL[line.payer])}</td>
        <td class="mono">${escapeHtml(line.cpt_code ?? "—")}</td>
        <td class="mono">${escapeHtml(line.modifier ?? "—")}</td>
        <td class="mono">${escapeHtml(line.rule_id ?? "—")}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8" />
    <title>${escapeHtml(meta.protocol_number)} billing grid v${meta.version_number}</title>
    <style>
      body{font-family:-apple-system,Segoe UI,Inter,sans-serif;color:#12181F;margin:32px;}
      h1{font-size:20px;margin:0 0 4px;}
      .meta{font-size:12px;color:#42506B;margin-bottom:20px;line-height:1.6;}
      table{width:100%;border-collapse:collapse;font-size:11px;}
      th{text-align:left;border-bottom:2px solid #12181F;padding:6px 4px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;}
      td{border-bottom:1px solid #E3E5E8;padding:6px 4px;vertical-align:top;}
      .mono{font-family:ui-monospace,SFMono-Regular,monospace;}
      .num{color:#6B7280;width:28px;}
      footer{margin-top:24px;font-size:10px;color:#6B7280;}
    </style></head><body>
    <h1>Medicare Coverage Analysis — Billing Grid</h1>
    <div class="meta">
      <strong>${escapeHtml(meta.protocol_number)}</strong> — ${escapeHtml(meta.title)}<br/>
      Institution: ${escapeHtml(meta.organization)} &middot; Phase: ${escapeHtml(meta.phase ?? "—")} &middot; Sponsor: ${escapeHtml(meta.sponsor ?? "—")}<br/>
      Qualifying Clinical Trial: ${meta.is_qct ? "Yes" : "No"} &middot; Grid version v${meta.version_number} (${escapeHtml(meta.status)})<br/>
      Rules engine version: ${escapeHtml(meta.rules_version)} &middot; Approved: ${escapeHtml(meta.approved_at ?? "not yet approved")}<br/>
      Generated: ${escapeHtml(new Date().toISOString())}
    </div>
    <table><thead><tr>
      <th></th><th>Procedure</th><th>Visit</th><th>Payer</th><th>CPT</th><th>Modifier</th><th>Rule</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <footer>Every line in this grid was reviewed and approved by a named human user. Classification is produced by the TrialGrid deterministic rules engine (${escapeHtml(meta.rules_version)}) against CMS NCD 310.1. Full audit trail available in TrialGrid.</footer>
    </body></html>`;

  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  setTimeout(() => frame.remove(), 1000);
}
