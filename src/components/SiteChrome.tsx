import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/security-compliance", label: "Security & compliance" },
  { to: "/pricing", label: "Pricing" },
  { to: "/glossary", label: "Glossary" },
] as const;

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-2", className)}>
      <span aria-hidden className="grid size-7 grid-cols-2 gap-px rounded-sm bg-border p-px">
        <span className="rounded-[1px] bg-medicare" />
        <span className="rounded-[1px] bg-sponsor" />
        <span className="rounded-[1px] bg-patient" />
        <span className="rounded-[1px] bg-grid-teal" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">TrialGrid</span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Wordmark />
        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/request-demo">Request a pilot</Link>
          </Button>
        </div>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-5 py-4 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-3">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="text-sm">
                {item.label}
              </Link>
            ))}
            <Link to="/auth" onClick={() => setOpen(false)} className="text-sm">
              Sign in
            </Link>
            <Button asChild size="sm" className="mt-2 w-full">
              <Link to="/request-demo" onClick={() => setOpen(false)}>
                Request a pilot
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-xs text-sm text-muted-foreground">
            Medicare coverage analysis as a software workflow with an audit trail — not a document-reading
            exercise redone from memory on every amendment.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <h2 className="font-display text-sm font-semibold">Product</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/glossary" className="hover:text-foreground">Billing glossary</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <h2 className="font-display text-sm font-semibold">Company</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/request-demo" className="hover:text-foreground">Request a pilot</Link></li>
            <li><Link to="/security-compliance" className="hover:text-foreground">Security &amp; compliance</Link></li>
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <h2 className="font-display text-sm font-semibold">Security contact</h2>
          <p className="text-muted-foreground">
            Report a vulnerability or request our security posture documentation directly:
          </p>
          <a href="mailto:security@trialgrid.health" className="font-mono text-xs text-grid-teal hover:underline">
            security@trialgrid.health
          </a>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TrialGrid. Coverage analysis software for research compliance teams.</p>
          <p>TrialGrid is not a certified billing agent. Every grid requires human approval.</p>
        </div>
      </div>
    </footer>
  );
}
