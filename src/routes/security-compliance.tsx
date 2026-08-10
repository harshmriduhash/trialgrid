import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/security-compliance")({
  head: () => ({
    meta: [
      { title: "Security & Compliance — TrialGrid Coverage Analysis" },
      {
        name: "description",
        content:
          "Immutable audit trail, separation of duties, row-level tenant isolation, and no protocol data used for model training. How TrialGrid protects research compliance work.",
      },
      { property: "og:title", content: "Security & Compliance — TrialGrid" },
      {
        property: "og:description",
        content: "Immutable audit trail, separation of duties, tenant isolation, and no training on your data.",
      },
    ],
  }),
  component: SecurityCompliance,
});

const CONTROLS = [
  {
    title: "Immutable audit trail",
    body: "Every upload, edit, submission, and approval writes an append-only audit event with actor, timestamp, and before/after state. The application role holds insert and select privileges only — there is no code path that edits or deletes an audit entry.",
  },
  {
    title: "Separation of duties",
    body: "The analyst who drafts a grid cannot approve it. This is enforced at the database level by a trigger, not by hiding a button in the interface. Attempting to self-approve fails the write.",
  },
  {
    title: "Version immutability",
    body: "Once a grid version is approved it is frozen. Amendments create a new version with a line-level diff. Historical versions remain exactly as they were signed.",
  },
  {
    title: "Row-level tenant isolation",
    body: "Every table carries an organization identifier and every policy scopes reads and writes to the caller's organization. Documents live in a private bucket partitioned by organization folder.",
  },
  {
    title: "Your protocols are not training data",
    body: "Protocol text is sent to the model provider only to extract the schedule of events, under a zero-retention configuration. Nothing you upload is used to train any model, ours or a vendor's.",
  },
  {
    title: "AI never makes the coverage decision",
    body: "The model extracts and cites. Classification runs through a deterministic rules engine with no model call, so the same protocol always produces the same coverage determination — and every determination names the rule that produced it.",
  },
  {
    title: "Session handling",
    body: "Sessions sign out automatically after thirty minutes of inactivity. Deactivated users lose access immediately while their historical audit entries remain intact and attributable.",
  },
  {
    title: "Human approval is mandatory",
    body: "No grid reaches an export without a named human approver signing it. TrialGrid is decision-support software; it does not submit claims and is not a certified billing agent.",
  },
];

function SecurityCompliance() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <p className="font-mono text-xs tracking-[0.18em] text-grid-teal uppercase">Security &amp; compliance</p>
            <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Built for the audit you hope never comes
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              A coverage analysis tool is only worth using if its output survives scrutiny. These are the controls
              that make TrialGrid output defensible, and the honest limits of what we claim today.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-16">
          <dl className="grid gap-4 sm:grid-cols-2">
            {CONTROLS.map((control) => (
              <div key={control.title} className="rounded-lg border border-border bg-card p-6">
                <dt className="font-display text-base font-semibold tracking-tight">{control.title}</dt>
                <dd className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{control.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-3xl px-5 py-14">
            <h2 className="font-display text-2xl font-semibold tracking-tight">What we do not claim yet</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              TrialGrid is an early-access product. We are not currently SOC 2 Type II certified and we do not
              advertise HIPAA compliance as a finished state. The architecture is built to those expectations —
              tenant isolation, append-only auditing, least-privilege database roles, encrypted storage — and we
              will publish attestation as it is completed rather than before.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              TrialGrid is designed to hold protocol documents and coverage decisions, not patient records. Do not
              upload identifiable participant data. If your pilot requires a BAA or a completed security
              questionnaire, tell us in your pilot request and we will work through it before you send a single
              document.
            </p>
            <div className="mt-7">
              <Button asChild>
                <Link to="/request-demo">Start a security review</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
