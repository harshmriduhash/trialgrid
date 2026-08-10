import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/request-demo")({
  head: () => ({
    meta: [
      { title: "Request a Pilot — TrialGrid Coverage Analysis" },
      {
        name: "description",
        content:
          "Run your next study through TrialGrid alongside your current process and compare the billing grid line by line. Tell us about your site to start a pilot.",
      },
      { property: "og:title", content: "Request a Pilot — TrialGrid" },
      { property: "og:description", content: "Compare TrialGrid output against your current coverage analysis, line by line." },
    ],
  }),
  component: RequestDemo,
});

function RequestDemo() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const { error: insertError } = await supabase.from("pilot_requests").insert({
      name: String(form.get("full_name") ?? ""),
      email: String(form.get("email") ?? ""),
      institution: String(form.get("institution") ?? ""),
      role: String(form.get("role") ?? ""),
      studies_per_year: String(form.get("annual_studies") ?? ""),
      message: String(form.get("notes") ?? ""),
    });
    setBusy(false);
    if (insertError) {
      setError("We couldn't submit that. Please email us at pilots@trialgrid.health.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-12 px-5 py-20 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-grid-teal uppercase">Early access</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Request a pilot</h1>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            We onboard a small number of research sites at a time. A pilot means running your next study through
            TrialGrid in parallel with your existing process, then comparing the grids line by line.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
            <li className="border-l-2 border-grid-teal/40 pl-4">
              No cost for the first 90 days, no card, no auto-renewal.
            </li>
            <li className="border-l-2 border-grid-teal/40 pl-4">
              We complete your security questionnaire before you upload anything.
            </li>
            <li className="border-l-2 border-grid-teal/40 pl-4">
              If the output doesn't hold up against your analyst's work, we want to know that more than you do.
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-8">
          {sent ? (
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">Request received</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                We'll be in touch within two business days with next steps and our security documentation.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" name="full_name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="institution">Institution or site</Label>
                <Input id="institution" name="institution" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Your role</Label>
                <Input id="role" name="role" placeholder="Research compliance officer, billing analyst…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="annual_studies">Roughly how many coverage analyses per year?</Label>
                <Input id="annual_studies" name="annual_studies" placeholder="e.g. 40" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Anything we should know?</Label>
                <Textarea id="notes" name="notes" rows={4} placeholder="Current tooling, security requirements, timelines…" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Sending…" : "Request a pilot"}
              </Button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
