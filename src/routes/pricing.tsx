import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — TrialGrid Coverage Analysis Software" },
      {
        name: "description",
        content:
          "Per-site annual licensing with unlimited studies. Early-access pilots include onboarding and a line-by-line comparison against your current coverage analysis process.",
      },
      { property: "og:title", content: "Pricing — TrialGrid" },
      { property: "og:description", content: "Per-site annual licensing with unlimited studies. Pilots include onboarding." },
    ],
  }),
  component: Pricing,
});

const TIERS = [
  {
    name: "Pilot",
    price: "No cost",
    period: "for the first 90 days",
    summary: "For a single research site validating the output against its current process.",
    features: [
      "Up to 5 studies",
      "Full rules engine and audit trail",
      "AI protocol extraction",
      "CSV and PDF export",
      "Onboarding session with our team",
    ],
    cta: "Request a pilot",
    featured: true,
  },
  {
    name: "Site",
    price: "$18,000",
    period: "per site, per year",
    summary: "For an academic medical center or research site running coverage analysis continuously.",
    features: [
      "Unlimited studies and amendments",
      "Unlimited analyst and approver seats",
      "Version diffing across amendments",
      "Full audit export for monitoring visits",
      "Priority support",
    ],
    cta: "Talk to us",
    featured: false,
  },
  {
    name: "Network",
    price: "Custom",
    period: "multi-site health systems",
    summary: "For systems standardising coverage analysis across several sites and CTMS instances.",
    features: [
      "Everything in Site",
      "Cross-site policy templates",
      "SSO and directory provisioning",
      "Security questionnaire and BAA support",
      "Named implementation contact",
    ],
    cta: "Talk to us",
    featured: false,
  },
];

function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-3xl px-5 py-20 text-center">
            <p className="font-mono text-xs tracking-[0.18em] text-grid-teal uppercase">Pricing</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Priced against the analyst hours it returns
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              A single coverage analysis takes an experienced analyst two to four days. A single billing error
              found in audit costs considerably more than a year of software.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-5 lg:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={
                  tier.featured
                    ? "rounded-lg border-2 border-grid-teal bg-card p-7"
                    : "rounded-lg border border-border bg-card p-7"
                }
              >
                {tier.featured && (
                  <p className="mb-3 inline-flex rounded-sm bg-grid-teal-soft px-2 py-0.5 font-mono text-[10px] tracking-wider text-grid-teal uppercase">
                    Early access
                  </p>
                )}
                <h2 className="font-display text-xl font-semibold tracking-tight">{tier.name}</h2>
                <p className="mt-4 font-display text-3xl font-semibold tracking-tight">{tier.price}</p>
                <p className="text-sm text-muted-foreground">{tier.period}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{tier.summary}</p>
                <ul className="mt-6 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-grid-teal" aria-hidden />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-7 w-full" variant={tier.featured ? "default" : "outline"}>
                  <Link to="/request-demo">{tier.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Pilot pricing applies to the first cohort of early-access sites. No card required, no auto-renewal.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
