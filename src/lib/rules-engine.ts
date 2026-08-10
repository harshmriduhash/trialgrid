/**
 * TrialGrid deterministic coverage-analysis rules engine.
 *
 * GOVERNING PRINCIPLE (PRD §7):
 * The compliance decision — payer classification under CMS NCD 310.1 — is made
 * HERE, by versioned deterministic rules. No LLM ever writes a payer or CPT
 * value. AI only extracts procedures from documents; this module classifies
 * them, and a human always approves.
 *
 * If the engine has no matching rule it returns `unassigned` +
 * `MANUAL-REVIEW` — an explicit "I don't know", never a silent guess.
 */

export const RULES_VERSION = "ncd-310.1-2024.1";

export type Payer = "medicare" | "sponsor" | "patient" | "unassigned";
export type Confidence = "high" | "medium" | "low";

export interface ProcedureInput {
  procedure_name: string;
  visit_label?: string | null;
  frequency?: string | null;
  notes?: string | null;
  /** Verbatim protocol text this line came from, used for citation display. */
  source_excerpt?: string | null;
  source_page?: number | null;
}

export interface StudyContext {
  is_qct: boolean;
  phase?: string | null;
}

export interface Classification {
  payer: Payer;
  cpt_code: string | null;
  modifier: string | null;
  confidence: Confidence;
  rule_id: RuleId;
  rule_citation: string;
  rationale: string;
  needs_review: boolean;
}

export type RuleId =
  | "QCT-GATE"
  | "ROUTINE-SOC"
  | "ROUTINE-MONITOR"
  | "ROUTINE-COMPLICATION"
  | "RESEARCH-INVESTIGATIONAL"
  | "RESEARCH-DATA-ONLY"
  | "RESEARCH-FREQUENCY"
  | "RESEARCH-SCREEN-FAIL"
  | "PATIENT-STANDARD-COST"
  | "MANUAL-REVIEW";

export const RULE_CITATIONS: Record<RuleId, string> = {
  "QCT-GATE": "CMS NCD 310.1 §2 — Qualifying Clinical Trial criteria",
  "ROUTINE-SOC": "CMS NCD 310.1 §2.1 — Routine costs: conventional care",
  "ROUTINE-MONITOR": "CMS NCD 310.1 §2.1(b) — Monitoring of the investigational item",
  "ROUTINE-COMPLICATION": "CMS NCD 310.1 §2.1(c) — Complication management",
  "RESEARCH-INVESTIGATIONAL": "CMS NCD 310.1 §2.2(a) — Investigational item or service",
  "RESEARCH-DATA-ONLY": "CMS NCD 310.1 §2.2(b) — Data collection and analysis only",
  "RESEARCH-FREQUENCY": "CMS NCD 310.1 §2.2(b) — Frequency exceeding standard of care",
  "RESEARCH-SCREEN-FAIL": "CMS NCD 310.1 §2.2(b) — Eligibility-determination testing",
  "PATIENT-STANDARD-COST": "CMS NCD 310.1 §3 — Deductible and coinsurance",
  "MANUAL-REVIEW": "TrialGrid rules engine — no matching rule",
};

/** Modifier reference (CMS): Q0 investigational, Q1 routine service in a QCT. */
export const MODIFIER_Q0 = "Q0";
export const MODIFIER_Q1 = "Q1";

interface CptEntry {
  cpt: string;
  label: string;
  /** Terms that identify this procedure in protocol Schedule-of-Events text. */
  match: string[];
}

/**
 * Standard-of-care CPT reference table. Deliberately conservative and small:
 * an unmatched procedure is routed to human review rather than mis-coded.
 */
export const CPT_REFERENCE: CptEntry[] = [
  { cpt: "85025", label: "CBC with differential", match: ["cbc with diff", "cbc w/ diff", "complete blood count", "cbc"] },
  { cpt: "85027", label: "CBC without differential", match: ["cbc without differential"] },
  { cpt: "80053", label: "Comprehensive metabolic panel", match: ["comprehensive metabolic", "cmp"] },
  { cpt: "80048", label: "Basic metabolic panel", match: ["basic metabolic", "bmp"] },
  { cpt: "80061", label: "Lipid panel", match: ["lipid panel", "lipid profile"] },
  { cpt: "80076", label: "Hepatic function panel", match: ["hepatic function", "liver function", "lft"] },
  { cpt: "84443", label: "Thyroid stimulating hormone", match: ["tsh", "thyroid stimulating"] },
  { cpt: "85610", label: "Prothrombin time", match: ["prothrombin", "pt/inr", "inr"] },
  { cpt: "85730", label: "Partial thromboplastin time", match: ["ptt", "partial thromboplastin"] },
  { cpt: "81003", label: "Urinalysis, automated", match: ["urinalysis", "urine dipstick"] },
  { cpt: "84703", label: "Pregnancy test, qualitative", match: ["pregnancy test", "serum hcg", "urine hcg", "beta hcg"] },
  { cpt: "93000", label: "Electrocardiogram, complete", match: ["ecg", "ekg", "electrocardiogram", "12-lead"] },
  { cpt: "93306", label: "Echocardiography, complete", match: ["echocardiogram", "echo", "muga"] },
  { cpt: "71046", label: "Chest X-ray, 2 views", match: ["chest x-ray", "chest xray", "cxr"] },
  { cpt: "71260", label: "CT chest with contrast", match: ["ct chest", "chest ct"] },
  { cpt: "74177", label: "CT abdomen/pelvis with contrast", match: ["ct abdomen", "ct a/p", "abdominal ct"] },
  { cpt: "70553", label: "MRI brain with and without contrast", match: ["mri brain", "brain mri"] },
  { cpt: "78815", label: "PET/CT skull base to mid-thigh", match: ["pet/ct", "pet ct", "pet scan"] },
  { cpt: "99213", label: "Office/outpatient visit, established", match: ["clinic visit", "office visit", "physical exam", "physical examination", "study visit"] },
  { cpt: "99204", label: "Office/outpatient visit, new patient", match: ["new patient visit", "initial consultation"] },
  { cpt: "99211", label: "Nurse visit", match: ["nurse visit", "vital signs", "vitals"] },
  { cpt: "96413", label: "Chemotherapy IV infusion, up to 1 hour", match: ["chemotherapy infusion", "iv chemotherapy", "chemo infusion"] },
  { cpt: "96365", label: "IV infusion, therapeutic, initial hour", match: ["iv infusion", "intravenous infusion"] },
  { cpt: "36415", label: "Venipuncture", match: ["blood draw", "venipuncture", "phlebotomy"] },
  { cpt: "88305", label: "Surgical pathology, level IV", match: ["tumor biopsy", "pathology review", "surgical pathology"] },
  { cpt: "38221", label: "Bone marrow biopsy", match: ["bone marrow biopsy", "bone marrow aspirate"] },
  { cpt: "94010", label: "Spirometry", match: ["spirometry", "pulmonary function", "pft"] },
  { cpt: "92014", label: "Ophthalmological exam, established", match: ["ophthalmologic exam", "eye exam", "slit lamp"] },
];

const INVESTIGATIONAL_TERMS = [
  "investigational product",
  "investigational drug",
  "investigational agent",
  "investigational device",
  "study drug administration",
  "study drug dispens",
  "study agent",
  "imp administration",
  "placebo",
  "randomization",
  "drug accountability",
  "study medication",
];

const RESEARCH_ONLY_TERMS = [
  "pharmacokinetic",
  "pharmacodynamic",
  " pk ",
  "pk sample",
  "biomarker",
  "correlative",
  "exploratory",
  "research blood",
  "research sample",
  "specimen banking",
  "biobank",
  "tissue banking",
  "immunogenicity",
  "anti-drug antibody",
  "genomic research",
  "quality of life questionnaire",
  "qol questionnaire",
  "patient diary",
  "eDiary",
  "central read",
  "central laboratory",
  "data collection",
];

const SCREENING_ONLY_TERMS = [
  "eligibility",
  "screening only",
  "inclusion criteria",
  "exclusion criteria",
  "confirm eligibility",
  "screen fail",
];

const EXCESS_FREQUENCY_TERMS = [
  "additional",
  "extra",
  "non-standard frequency",
  "more frequent",
  "beyond standard",
  "in addition to standard",
  "above standard of care",
  "unscheduled repeat",
];

const COMPLICATION_TERMS = [
  "adverse event",
  "toxicity management",
  "complication",
  "serious adverse",
  "sae follow-up",
  "hospitalization for toxicity",
];

const MONITORING_TERMS = [
  "safety lab",
  "safety monitoring",
  "toxicity assessment",
  "dose-limiting toxicity",
  "cardiac monitoring",
  "infusion monitoring",
];

function norm(value: string | null | undefined): string {
  return ` ${(value ?? "").toLowerCase().replace(/[^a-z0-9/+.\- ]/g, " ").replace(/\s+/g, " ").trim()} `;
}

function includesAny(haystack: string, needles: string[]): string | null {
  for (const needle of needles) {
    if (haystack.includes(needle.toLowerCase())) return needle;
  }
  return null;
}

export function lookupCpt(procedureName: string): CptEntry | null {
  const haystack = norm(procedureName);
  let best: CptEntry | null = null;
  let bestLength = 0;
  for (const entry of CPT_REFERENCE) {
    for (const term of entry.match) {
      if (haystack.includes(` ${term} `) || haystack.includes(term)) {
        if (term.length > bestLength) {
          best = entry;
          bestLength = term.length;
        }
      }
    }
  }
  return best;
}

/**
 * Classify a single protocol procedure. Pure, synchronous, side-effect free —
 * this is the function the unit-test suite exercises exhaustively.
 */
export function classifyProcedure(
  input: ProcedureInput,
  context: StudyContext,
): Classification {
  const text = norm(
    [input.procedure_name, input.notes, input.frequency, input.source_excerpt].filter(Boolean).join(" • "),
  );
  const nameText = norm(input.procedure_name);
  const cpt = lookupCpt(input.procedure_name);

  const build = (
    payer: Payer,
    rule_id: RuleId,
    confidence: Confidence,
    rationale: string,
    opts: { cpt?: string | null; modifier?: string | null } = {},
  ): Classification => ({
    payer,
    cpt_code: opts.cpt === undefined ? (cpt?.cpt ?? null) : opts.cpt,
    modifier: opts.modifier ?? null,
    confidence,
    rule_id,
    rule_citation: RULE_CITATIONS[rule_id],
    rationale,
    needs_review: confidence !== "high",
  });

  // R1 — Investigational item itself. Never a routine cost.
  const investigational = includesAny(text, INVESTIGATIONAL_TERMS);
  if (investigational) {
    return build(
      "sponsor",
      "RESEARCH-INVESTIGATIONAL",
      "high",
      `Matched investigational-item language ("${investigational.trim()}"). The investigational item and its administration are never routine costs and are sponsor responsibility.`,
      { cpt: null },
    );
  }

  // R2 — QCT gate. Outside a qualifying clinical trial nothing is a routine cost.
  if (!context.is_qct) {
    return build(
      "sponsor",
      "QCT-GATE",
      "medium",
      "This study is not flagged as a Qualifying Clinical Trial, so no protocol-required item may be billed to Medicare as a routine cost. Confirm QCT status before billing.",
      { cpt: cpt?.cpt ?? null },
    );
  }

  // R3 — Research-only / data-collection services.
  const researchOnly = includesAny(text, RESEARCH_ONLY_TERMS);
  if (researchOnly) {
    return build(
      "sponsor",
      "RESEARCH-DATA-ONLY",
      "high",
      `Matched data-collection-only language ("${researchOnly.trim()}"). Services provided solely to satisfy protocol data collection are not routine costs.`,
      { cpt: null },
    );
  }

  // R4 — Eligibility / screening-only testing.
  const screening = includesAny(text, SCREENING_ONLY_TERMS);
  if (screening) {
    return build(
      "sponsor",
      "RESEARCH-SCREEN-FAIL",
      "medium",
      `Matched eligibility-determination language ("${screening.trim()}"). Testing performed solely to determine trial eligibility is a research cost. Confirm whether the test would also have been clinically indicated.`,
    );
  }

  // R5 — Frequency exceeding standard of care.
  const excess = includesAny(text, EXCESS_FREQUENCY_TERMS);
  if (excess) {
    return build(
      "sponsor",
      "RESEARCH-FREQUENCY",
      "low",
      `Protocol language suggests this service is performed beyond standard-of-care frequency ("${excess.trim()}"). The excess occurrences are research costs; the standard-of-care baseline occurrences remain Medicare routine costs. A human must split or confirm this line.`,
    );
  }

  // R6 — Complication / toxicity management is a routine cost.
  const complication = includesAny(text, COMPLICATION_TERMS);
  if (complication) {
    return build(
      "medicare",
      "ROUTINE-COMPLICATION",
      cpt ? "high" : "medium",
      `Matched complication-management language ("${complication.trim()}"). Care for complications arising from the investigational item is a routine cost billable to Medicare.`,
      { modifier: MODIFIER_Q1 },
    );
  }

  // R7 — Reasonably necessary monitoring of the investigational item.
  const monitoring = includesAny(text, MONITORING_TERMS);
  if (monitoring) {
    return build(
      "medicare",
      "ROUTINE-MONITOR",
      cpt ? "medium" : "low",
      `Matched monitoring language ("${monitoring.trim()}"). Monitoring reasonably necessary for the provision of the investigational item is a routine cost. Confirm the frequency does not exceed clinical necessity.`,
      { modifier: MODIFIER_Q1 },
    );
  }

  // R8 — Recognised standard-of-care service with a known CPT code.
  if (cpt) {
    return build(
      "medicare",
      "ROUTINE-SOC",
      "high",
      `Matched conventional service "${cpt.label}" (CPT ${cpt.cpt}). Items typically provided absent a clinical trial are routine costs billable to Medicare with modifier ${MODIFIER_Q1} and diagnosis Z00.6.`,
      { modifier: MODIFIER_Q1 },
    );
  }

  // R9 — Explicit "I don't know".
  return build(
    "unassigned",
    "MANUAL-REVIEW",
    "low",
    `No rule in ${RULES_VERSION} matches "${nameText.trim()}". The engine will not guess on a compliance-critical field — assign the payer and CPT code manually.`,
    { cpt: null },
  );
}

export interface ClassifiedLine extends ProcedureInput, Classification {
  position: number;
}

export function classifyAll(
  procedures: ProcedureInput[],
  context: StudyContext,
): ClassifiedLine[] {
  return procedures.map((procedure, index) => ({
    ...procedure,
    ...classifyProcedure(procedure, context),
    position: index,
  }));
}

export function summarise(lines: { payer: Payer; needs_review: boolean }[]) {
  return {
    total: lines.length,
    medicare: lines.filter((l) => l.payer === "medicare").length,
    sponsor: lines.filter((l) => l.payer === "sponsor").length,
    patient: lines.filter((l) => l.payer === "patient").length,
    unassigned: lines.filter((l) => l.payer === "unassigned").length,
    needsReview: lines.filter((l) => l.needs_review).length,
  };
}
