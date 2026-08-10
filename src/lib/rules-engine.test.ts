import { describe, expect, it } from "vitest";
import {
  classifyAll,
  classifyProcedure,
  lookupCpt,
  RULES_VERSION,
  summarise,
} from "./rules-engine";

const qct = { is_qct: true, phase: "Phase III" };
const nonQct = { is_qct: false, phase: "Phase I" };

describe("CPT reference lookup", () => {
  it("maps common schedule-of-events labels to CPT codes", () => {
    expect(lookupCpt("CBC with diff")?.cpt).toBe("85025");
    expect(lookupCpt("12-lead ECG")?.cpt).toBe("93000");
    expect(lookupCpt("Comprehensive metabolic panel")?.cpt).toBe("80053");
    expect(lookupCpt("CT chest with contrast")?.cpt).toBe("71260");
  });

  it("returns null rather than guessing on unknown procedures", () => {
    expect(lookupCpt("Novel sponsor-specific assay ZX-9")).toBeNull();
  });
});

describe("NCD 310.1 — investigational item (§2.2a)", () => {
  it("assigns the investigational product to the sponsor with no CPT", () => {
    const result = classifyProcedure({ procedure_name: "Investigational drug administration" }, qct);
    expect(result.payer).toBe("sponsor");
    expect(result.rule_id).toBe("RESEARCH-INVESTIGATIONAL");
    expect(result.cpt_code).toBeNull();
    expect(result.confidence).toBe("high");
    expect(result.needs_review).toBe(false);
  });

  it("treats randomization and drug accountability as research", () => {
    expect(classifyProcedure({ procedure_name: "Randomization" }, qct).payer).toBe("sponsor");
    expect(classifyProcedure({ procedure_name: "Drug accountability" }, qct).payer).toBe("sponsor");
  });
});

describe("NCD 310.1 — QCT gate (§2)", () => {
  it("blocks Medicare assignment entirely when the trial is not a QCT", () => {
    const result = classifyProcedure({ procedure_name: "CBC with diff" }, nonQct);
    expect(result.payer).toBe("sponsor");
    expect(result.rule_id).toBe("QCT-GATE");
    expect(result.needs_review).toBe(true);
  });

  it("allows the same procedure as a routine cost inside a QCT", () => {
    const result = classifyProcedure({ procedure_name: "CBC with diff" }, qct);
    expect(result.payer).toBe("medicare");
    expect(result.rule_id).toBe("ROUTINE-SOC");
  });
});

describe("NCD 310.1 — research costs (§2.2b)", () => {
  it("classifies pharmacokinetic sampling as sponsor", () => {
    const result = classifyProcedure({ procedure_name: "Pharmacokinetic sampling" }, qct);
    expect(result.payer).toBe("sponsor");
    expect(result.rule_id).toBe("RESEARCH-DATA-ONLY");
    expect(result.cpt_code).toBeNull();
  });

  it("classifies biomarker and correlative samples as sponsor", () => {
    expect(classifyProcedure({ procedure_name: "Exploratory biomarker blood draw" }, qct).payer).toBe("sponsor");
    expect(classifyProcedure({ procedure_name: "Correlative tissue banking" }, qct).payer).toBe("sponsor");
  });

  it("flags eligibility-only testing for review", () => {
    const result = classifyProcedure(
      { procedure_name: "Serum chemistry", notes: "Performed to confirm eligibility" },
      qct,
    );
    expect(result.rule_id).toBe("RESEARCH-SCREEN-FAIL");
    expect(result.payer).toBe("sponsor");
    expect(result.needs_review).toBe(true);
  });

  it("flags frequency beyond standard of care as low confidence, never auto-approved", () => {
    const result = classifyProcedure(
      { procedure_name: "ECG", notes: "Additional ECG at Cycle 1 Day 1 beyond standard monitoring" },
      qct,
    );
    expect(result.rule_id).toBe("RESEARCH-FREQUENCY");
    expect(result.confidence).toBe("low");
    expect(result.needs_review).toBe(true);
  });
});

describe("NCD 310.1 — routine costs (§2.1)", () => {
  it("assigns complication management to Medicare with modifier Q1", () => {
    const result = classifyProcedure({ procedure_name: "Toxicity management visit" }, qct);
    expect(result.payer).toBe("medicare");
    expect(result.rule_id).toBe("ROUTINE-COMPLICATION");
    expect(result.modifier).toBe("Q1");
  });

  it("assigns investigational-item monitoring to Medicare but keeps it in review", () => {
    const result = classifyProcedure({ procedure_name: "Safety labs" }, qct);
    expect(result.payer).toBe("medicare");
    expect(result.rule_id).toBe("ROUTINE-MONITOR");
    expect(result.needs_review).toBe(true);
  });

  it("attaches modifier Q1 to standard-of-care routine costs", () => {
    const result = classifyProcedure({ procedure_name: "Chest x-ray" }, qct);
    expect(result.payer).toBe("medicare");
    expect(result.modifier).toBe("Q1");
    expect(result.cpt_code).toBe("71046");
  });
});

describe("Explicit unknown state (§7.6 fallback)", () => {
  it("never guesses — unmatched procedures return unassigned + MANUAL-REVIEW", () => {
    const result = classifyProcedure({ procedure_name: "Sponsor proprietary assay ZX-9" }, qct);
    expect(result.payer).toBe("unassigned");
    expect(result.rule_id).toBe("MANUAL-REVIEW");
    expect(result.cpt_code).toBeNull();
    expect(result.needs_review).toBe(true);
    expect(result.rationale).toContain(RULES_VERSION);
  });
});

describe("Rule precedence", () => {
  it("investigational status wins over a matching CPT code", () => {
    const result = classifyProcedure(
      { procedure_name: "Investigational drug administration via IV infusion" },
      qct,
    );
    expect(result.payer).toBe("sponsor");
    expect(result.cpt_code).toBeNull();
  });

  it("research-only status wins over standard-of-care matching", () => {
    const result = classifyProcedure({ procedure_name: "Research blood draw (venipuncture)" }, qct);
    expect(result.payer).toBe("sponsor");
    expect(result.rule_id).toBe("RESEARCH-DATA-ONLY");
  });
});

describe("Batch classification and summary", () => {
  it("preserves order and produces a payer summary", () => {
    const lines = classifyAll(
      [
        { procedure_name: "CBC with diff", visit_label: "Screening" },
        { procedure_name: "Investigational drug administration", visit_label: "Cycle 1" },
        { procedure_name: "Sponsor proprietary assay ZX-9", visit_label: "Cycle 1" },
      ],
      qct,
    );
    expect(lines.map((l) => l.position)).toEqual([0, 1, 2]);
    const summary = summarise(lines);
    expect(summary.total).toBe(3);
    expect(summary.medicare).toBe(1);
    expect(summary.sponsor).toBe(1);
    expect(summary.unassigned).toBe(1);
    expect(summary.needsReview).toBe(1);
  });

  it("every classification carries a citation back to published CMS guidance", () => {
    const lines = classifyAll(
      [
        { procedure_name: "CBC with diff" },
        { procedure_name: "Pharmacokinetic sampling" },
        { procedure_name: "Unknown thing" },
      ],
      qct,
    );
    for (const line of lines) {
      expect(line.rule_citation.length).toBeGreaterThan(10);
      expect(line.rationale.length).toBeGreaterThan(10);
    }
  });
});
