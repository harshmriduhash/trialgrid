import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Wordmark } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Workspace — TrialGrid" },
      { name: "description", content: "Your TrialGrid workspace: draft, review, and approve clinical trial billing grids." },
      { property: "og:title", content: "Workspace — TrialGrid" },
      { property: "og:description", content: "Draft, review, and approve clinical trial billing grids." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Workspace,
});

function Workspace() {
  const { loading, user, profile, roles, canApprove, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Wordmark />
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {profile?.full_name ?? user.email}
            </span>
            <Button size="sm" variant="outline" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Studies</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {profile?.email ?? user.email}
          {roles.length > 0 && ` · ${roles.join(", ")}`}
          {canApprove && " · approval rights"}
        </p>

        <div className="mt-10 rounded-lg border border-dashed border-border bg-background p-12 text-center">
          <h2 className="font-display text-xl font-semibold tracking-tight">No studies yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Upload a protocol to draft your first coverage analysis, or read how the workflow moves a grid from
            draft to approved.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
