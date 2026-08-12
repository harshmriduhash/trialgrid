import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Wordmark } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Workspace — TrialGrid" },
      {
        name: "description",
        content: "Your TrialGrid workspace: draft, review, and approve clinical trial billing grids.",
      },
      { property: "og:title", content: "Workspace — TrialGrid" },
      { property: "og:description", content: "Draft, review, and approve clinical trial billing grids." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { loading, user, profile, isAdmin, signOut } = useAuth();
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
          <div className="flex items-center gap-8">
            <Wordmark />
            <nav className="hidden items-center gap-5 text-sm sm:flex">
              <Link
                to="/app"
                activeOptions={{ exact: true }}
                activeProps={{ className: "text-foreground font-medium" }}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Studies
              </Link>
              {isAdmin && (
                <Link
                  to="/app/pilot-requests"
                  activeProps={{ className: "text-foreground font-medium" }}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pilot requests
                </Link>
              )}
              <Link
                to="/how-it-works"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                How it works
              </Link>
            </nav>
          </div>
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

      <Outlet />
    </div>
  );
}
