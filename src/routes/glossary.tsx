import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const Route = createFileRoute("/glossary")({
  head: () => ({
    meta: [
      { title: "Clinical Trial Billing Glossary — MCA, QCT, NCD 310.1" },
      {
        name: "description",
        content:
          "Plain-language definitions of the terms coverage analysis runs on: Medicare Coverage Analysis, qualifying clinical trial, routine costs, modifiers Q0 and Q1, and the False Claims Act exposure behind them.",
      },
      { property: "og:title", content: "Clinical Trial Billing Glossary — TrialGrid" },
      { property: "og:description", content: "Plain-language definitions of MCA, QCT, routine costs, and modifiers Q0/Q1." },
    ],
  }),
  component: Glossary,
});

const TERMS = [
  ["Medicare Coverage Analysis (MCA)", "A document-by-document determination of which items and services in a clinical trial Medicare will pay for, which the sponsor must fund, and which fall to the participant. Also called a coverage analysis or billing grid."],
  ["Billing grid", "The line-level output of a coverage analysis: every procedure, at every visit, mapped to a payer with a CPT code and modifier. It is the artefact billing staff actually use."],
  ["NCD 310.1", "The CMS National Coverage Determination governing routine costs in clinical trials. It defines which trials qualify and which costs Medicare will cover within them."],
  ["Qualifying clinical trial (QCT)", "A trial meeting the NCD 310.1 criteria — therapeutic intent, evaluation of an item within a Medicare benefit category, and appropriate sponsorship. If a trial is not a QCT, routine-cost coverage does not apply at all."],
  ["Routine costs", "Items and services that would be delivered to the patient anyway, outside the trial, for their condition. These stay with Medicare."],
  ["Investigational item", "The device or drug under study. Never billable to Medicare unless separately approved under a specific coverage pathway."],
  ["Research-only procedure", "A procedure performed solely to satisfy the protocol — extra imaging, pharmacokinetic draws, biomarker sampling. Sponsor responsibility."],
  ["Modifier Q0", "Appended to claims for an investigational clinical service provided in an approved clinical research study."],
  ["Modifier Q1", "Appended to claims for a routine clinical service provided in an approved clinical research study."],
  ["Separation of duties", "The control requiring that the person who prepares a determination is not the person who approves it. Foundational to any audit-defensible workflow."],
  ["False Claims Act", "The federal statute under which incorrect billing of research costs to Medicare becomes a fraud exposure — with treble damages. This is why coverage analysis errors matter far beyond the dollar value of the claim."],
  ["Amendment", "A protocol change that alters the schedule of events. Every amendment requires the coverage analysis to be revisited and re-approved, which is where most institutional drift begins."],
];

function Glossary() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <p className="font-mono text-xs tracking-[0.18em] text-grid-teal uppercase">Reference</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Clinical trial billing glossary
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              The vocabulary coverage analysis runs on, without the regulatory throat-clearing.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-5 py-14">
          <dl className="divide-y divide-border">
            {TERMS.map(([term, definition]) => (
              <div key={term} className="py-6">
                <dt className="font-display text-lg font-semibold tracking-tight">{term}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
