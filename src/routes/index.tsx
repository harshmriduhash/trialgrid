import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileSearch, Scale, ShieldCheck } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { PayerTag } from "@/components/PayerTag";
import { Button } from "@/components/ui/button";

const TITLE = "TrialGrid — Medicare Coverage Analysis with an Audit Trail";
const DESCRIPTION =
  "TrialGrid turns clinical trial protocols into defensible Medicare billing grids: AI reads the schedule of events, a deterministic CMS NCD 310.1 rules engine assigns every payer, and a named human approves each line.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const SAMPLE_ROWS = [
  { procedure: "Screening ECG (12-lead)", visit: "Screening", payer: "medicare" as const, cpt: "93000", rule: "ROUTINE-SOC" },
  { procedure: "Investigational product infusion", visit: "C1D1", payer: "sponsor" as const, cpt: null, rule: "RESEARCH-INVESTIGATIONAL" },
  { procedure: "PK blood sample (research only)", visit: "C1D1", payer: "sponsor" as const, cpt: null, rule: "RESEARCH-DATA-ONLY" },
  { procedure: "CBC with differential", visit: "Every cycle", payer: "medicare" as const, cpt: "85025", rule: "ROUTINE-MONITOR" },
  { procedure: "Optional sub-study biopsy", visit: "C3D1", payer: "unassigned" as const, cpt: null, rule: "MANUAL-REVIEW" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
            <div>
              <p className="font-mono text-xs tracking-[0.18em] text-grid-teal uppercase">
                CMS NCD 310.1 · Coverage analysis
              </p>
              <h1 className="mt-5 font-display text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Billing grids your compliance officer will actually sign.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                A coverage analysis is a legal document. TrialGrid drafts it as software: AI reads the schedule
                of events, a deterministic rules engine assigns Medicare, sponsor, or patient to every line with
                a citation, and nothing leaves the system until a named human approves it.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/request-demo">
                    Request a pilot <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/how-it-works">See the workflow</Link>
                </Button>
              </div>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
                {[
                  ["3–6 wks", "Typical manual turnaround"],
                  ["< 1 day", "Draft-to-approval in TrialGrid"],
                  ["100%", "Lines with a rule citation"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="font-display text-2xl font-semibold tracking-tight">{value}</dt>
                    <dd className="mt-1 text-xs leading-snug text-muted-foreground">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                  PROT-2024-0187 · grid v2
                </p>
                <span className="rounded-sm border border-grid-teal/30 bg-grid-teal-soft px-2 py-0.5 font-mono text-[10px] tracking-wide text-grid-teal uppercase">
                  Approved
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                    <th className="py-3 font-medium">Procedure</th>
                    <th className="py-3 font-medium">Payer</th>
                    <th className="py-3 text-right font-medium">CPT</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ROWS.map((row) => (
                    <tr key={row.procedure} className="border-t border-border/70 align-top">
                      <td className="py-3 pr-3">
                        <p className="font-medium">{row.procedure}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {row.visit} · {row.rule}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <PayerTag payer={row.payer} />
                      </td>
                      <td className="py-3 text-right font-mono text-xs text-muted-foreground">
                        {row.cpt ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                Every row carries the rule that produced it, the protocol excerpt it came from, and the person
                who approved it.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-secondary">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight">
              The problem isn't that coverage analysis is hard. It's that it's invisible.
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: FileSearch,
                  title: "Protocols are read, not parsed",
                  body:
                    "An analyst reads 120 pages and retypes the schedule of events into a spreadsheet. Amendment 4 arrives and the reading starts again from zero.",
                },
                {
                  icon: Scale,
                  title: "Judgment leaves no record",
                  body:
                    "Why is this ECG billed to Medicare? Six months later nobody can reconstruct the reasoning — and that's exactly what an audit asks for.",
                },
                {
                  icon: ShieldCheck,
                  title: "The downside is a False Claims Act case",
                  body:
                    "Billing a research-only procedure to Medicare is not a clerical error. Sites have settled for millions over grids nobody could defend.",
                },
              ].map((item) => (
                <div key={item.title} className="border-l-2 border-grid-teal/40 pl-5">
                  <item.icon className="size-5 text-grid-teal" aria-hidden />
                  <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="font-mono text-xs tracking-[0.18em] text-grid-teal uppercase">How it works</p>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight">
              AI drafts. The rules engine decides. A human approves.
            </h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-4">
              {[
                ["01", "Upload the protocol", "Paste or upload the schedule of events. Documents stay in per-institution isolated storage."],
                ["02", "Structured extraction", "The model transcribes procedures, visits and qualifiers verbatim — it never picks a payer or a CPT code."],
                ["03", "Deterministic classification", "The NCD 310.1 rules engine assigns payer, CPT and modifier, with the citation attached to each line."],
                ["04", "Review and approve", "An approver — never the person who drafted it — signs the version. It becomes immutable and exportable."],
              ].map(([step, title, body]) => (
                <li key={step}>
                  <span className="font-mono text-xs tracking-widest text-muted-foreground">{step}</span>
                  <h3 className="mt-3 font-display text-lg font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-border bg-ink text-paper">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Run your next study through TrialGrid in parallel.
              </h2>
              <p className="mt-2 max-w-xl text-sm text-paper/70">
                Keep your current process. Compare the two grids line by line. If ours doesn't hold up, we want
                to know before you do.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <Link to="/request-demo">Request a pilot</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
