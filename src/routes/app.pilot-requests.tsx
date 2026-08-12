import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/pilot-requests")({
  component: PilotRequests,
});

interface RequestRow {
  id: string;
  created_at: string;
  name: string;
  email: string;
  institution: string;
  role: string | null;
  studies_per_year: string | null;
  message: string | null;
}

function PilotRequests() {
  const requests = useQuery({
    queryKey: ["pilot_requests"],
    queryFn: async (): Promise<RequestRow[]> => {
      const { data, error } = await supabase
        .from("pilot_requests")
        .select("id, created_at, name, email, institution, role, studies_per_year, message")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RequestRow[];
    },
  });

  const rows = requests.data ?? [];

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Pilot requests</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Inbound requests from the public pilot form. Visible to admins only.
      </p>

      {requests.isLoading ? (
        <p className="mt-10 font-mono text-xs tracking-widest text-muted-foreground uppercase">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-border bg-background px-5 py-12 text-center text-sm text-muted-foreground">
          No pilot requests yet.
        </p>
      ) : (
        <ul className="mt-10 space-y-3">
          {rows.map((request) => (
            <li key={request.id} className="rounded-lg border border-border bg-background p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  {request.name} · <span className="text-muted-foreground">{request.institution}</span>
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="mt-1 font-mono text-xs text-grid-teal">{request.email}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {request.role ?? "Role not given"} · {request.studies_per_year ?? "—"} analyses/year
              </p>
              {request.message && (
                <p className="mt-3 border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground">
                  {request.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
