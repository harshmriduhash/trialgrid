import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileSearch, ShieldCheck, GitBranch } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { PayerTag } from "@/components/PayerTag";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How TrialGrid Works — Protocol to Approved Billing Grid" },
      {
        name: "description",
        content:
          "Upload a protocol, let AI draft the schedule of events, apply the deterministic NCD 310.1 rules engine, then route to a named approver. Four steps, one audit trail.",
      },
      { property: "og:title", content: "How TrialGrid Works — Protocol to Approved Billing Grid" },
      {
        property: "og:description",
        content: "AI drafts. A deterministic rules engine classifies. A named human approves. Every step is logged.",
      },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  {
    icon: FileSearch,
    step: "01",
    title: "Upload the protocol and informed consent",
    body: "Drop in the protocol PDF, the schedule of events, and the consent form. TrialGrid extracts every procedure, visit, and frequency into structured rows — the tedious transcription that eats the first day of any coverage analysis.",
    detail:
      "Extraction is the only place AI touches your data. Every extracted line carries the page number and verbatim excerpt it came from, so you verify against the source instead of trusting a summary.",
  },
  {
    icon: ShieldCheck,
    step: "02",
    title: "The rules engine classifies — deterministically",
    body: "Each line runs through a hard-coded implementation of CMS NCD 310.1: qualifying clinical trial gate, routine costs, investigational items, research-only procedures, and complication management.",
    detail:
      "This step contains no model call. The same inputs always yield the same outputs, and each classification cites the exact rule and clause that produced it. That is what makes the result defensible.",
  },
  {
    icon: GitBranch,
    step: "03",
    title: "Review, edit, and resolve every flag",
    body: "Low-confidence and unassigned lines surface at the top of the queue. Analysts adjust payer assignment, CPT code, and modifiers inline. Every override captures a reason.",
    detail:
      "You cannot submit a grid with unresolved unassigned lines. The workflow forces the ambiguity to be settled by a person before anything moves forward.",
  },
  {
    icon: ArrowRight,
    step: "04",
    title: "A named approver signs. The version freezes.",
    body: "Submission routes to an approver who is not the analyst who drafted it. On approval, the grid version becomes immutable and exports to CSV or PDF for your billing system.",
    detail:
      "Amendments create a new version with a line-level diff against the approved one — so you can answer 'what changed and who signed off' in seconds, not in a week of email archaeology.",
  },
];

function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-3xl px-5 py-20 text-center">
            <p className="font-mono text-xs tracking-[0.18em] text-grid-teal uppercase">The workflow</p>
            <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Protocol in. Defensible billing grid out.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Coverage analysis is not a document-reading problem. It is a decision-tracking problem. TrialGrid
              treats it that way.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-16">
          <ol className="space-y-4">
            {STEPS.map((item) => (
              <li key={item.step} className="rounded-lg border border-border bg-card p-7">
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="flex sm:flex-col sm:items-center">
                    <span className="flex size-11 items-center justify-center rounded-md border border-border bg-secondary">
                      <item.icon className="size-5 text-grid-teal" aria-hidden />
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-xs tracking-widest text-muted-foreground">STEP {item.step}</p>
                    <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight">{item.title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    <p className="mt-3 border-l-2 border-grid-teal/40 pl-4 text-sm leading-relaxed text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-4xl px-5 py-16">
            <h2 className="font-display text-2xl font-semibold tracking-tight">What the three tags mean</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Every line in a TrialGrid billing grid resolves to exactly one payer. Colour is never the only
              signal — the label travels with it everywhere it appears.
            </p>
            <dl className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                {
                  payer: "medicare" as const,
                  text: "Routine costs Medicare covers because they would be delivered anyway for a patient with this condition, outside the trial.",
                },
                {
                  payer: "sponsor" as const,
                  text: "Investigational items and anything performed solely to satisfy the protocol — research labs, extra imaging, data collection.",
                },
                {
                  payer: "patient" as const,
                  text: "Standard coinsurance, deductibles, and non-covered services the participant remains responsible for.",
                },
              ].map((item) => (
                <div key={item.payer} className="rounded-lg border border-border bg-background p-5">
                  <dt>
                    <PayerTag payer={item.payer} />
                  </dt>
                  <dd className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight">See it against your own protocol</h2>
          <p className="mt-4 text-muted-foreground">
            Pilot sites run their next study through TrialGrid alongside their current process and compare the
            output line by line.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/request-demo">Request a pilot</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/security-compliance">Review security posture</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
