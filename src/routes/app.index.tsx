import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatusPill } from "@/components/PayerTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SAMPLE_PROTOCOL_NUMBER, SAMPLE_PROTOCOL_TITLE } from "@/lib/sample-protocol";
import { recordAudit } from "@/lib/audit";

export const Route = createFileRoute("/app/")({
  component: StudiesPage,
});

interface StudyRow {
  id: string;
  protocol_number: string;
  title: string;
  phase: string | null;
  sponsor: string | null;
  is_qct: boolean;
  status: string;
  updated_at: string;
}

function StudiesPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isQct, setIsQct] = useState(true);

  const studies = useQuery({
    queryKey: ["studies"],
    queryFn: async (): Promise<StudyRow[]> => {
      const { data, error } = await supabase
        .from("studies")
        .select("id, protocol_number, title, phase, sponsor, is_qct, status, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudyRow[];
    },
  });

  const createStudy = useMutation({
    mutationFn: async (form: FormData) => {
      if (!profile?.org_id) throw new Error("No institution linked to your account.");
      const { data, error } = await supabase
        .from("studies")
        .insert({
          org_id: profile.org_id,
          created_by: user?.id ?? null,
          protocol_number: String(form.get("protocol_number") ?? "").trim(),
          title: String(form.get("title") ?? "").trim(),
          phase: String(form.get("phase") ?? "").trim() || null,
          sponsor: String(form.get("sponsor") ?? "").trim() || null,
          is_qct: isQct,
        })
        .select("id, protocol_number")
        .single();
      if (error) throw error;
      await recordAudit({
        org_id: profile.org_id,
        actor_id: user?.id ?? "",
        actor_email: profile.email,
        event_type: "study.created",
        entity_type: "study",
        entity_id: data.id,
        study_id: data.id,
        summary: `Created study ${data.protocol_number}`,
      });
      return data;
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Study created. Upload the protocol to draft a grid.");
      void queryClient.invalidateQueries({ queryKey: ["studies"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = studies.data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Studies</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {profile?.email}
            {rows.length > 0 && ` · ${rows.length} stud${rows.length === 1 ? "y" : "ies"}`}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New study</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display tracking-tight">New study</DialogTitle>
              <DialogDescription>
                Protocol-level metadata only. Never enter patient-identifying information.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                createStudy.mutate(new FormData(event.currentTarget));
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="protocol_number">Protocol number</Label>
                <Input id="protocol_number" name="protocol_number" required placeholder={SAMPLE_PROTOCOL_NUMBER} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Study title</Label>
                <Input id="title" name="title" required placeholder={SAMPLE_PROTOCOL_TITLE.slice(0, 60)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phase">Phase</Label>
                  <Input id="phase" name="phase" placeholder="Phase II" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sponsor">Sponsor</Label>
                  <Input id="sponsor" name="sponsor" placeholder="Sponsor name" />
                </div>
              </div>
              <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
                <div>
                  <Label htmlFor="is_qct">Qualifying Clinical Trial</Label>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Meets CMS NCD 310.1 §2 criteria. If off, every line defaults to sponsor or patient.
                  </p>
                </div>
                <Switch id="is_qct" checked={isQct} onCheckedChange={setIsQct} />
              </div>
              <Button type="submit" className="w-full" disabled={createStudy.isPending}>
                {createStudy.isPending ? "Creating…" : "Create study"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {studies.isLoading ? (
        <p className="mt-10 font-mono text-xs tracking-widest text-muted-foreground uppercase">Loading studies…</p>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border bg-background p-12 text-center">
          <h2 className="font-display text-xl font-semibold tracking-tight">No studies yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create a study, paste the schedule of events, and TrialGrid drafts a billing grid you can review
            line by line.
          </p>
        </div>
      ) : (
        <div className="mt-10 overflow-hidden rounded-lg border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border">
              <tr className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                <th className="px-5 py-3 font-medium">Protocol</th>
                <th className="px-5 py-3 font-medium">Phase</th>
                <th className="px-5 py-3 font-medium">Sponsor</th>
                <th className="px-5 py-3 font-medium">QCT</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((study) => (
                <tr key={study.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/60">
                  <td className="px-5 py-4">
                    <Link
                      to="/app/studies/$id"
                      params={{ id: study.id }}
                      className="font-mono text-xs text-grid-teal hover:underline"
                    >
                      {study.protocol_number}
                    </Link>
                    <p className="mt-1 max-w-md leading-snug">{study.title}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{study.phase ?? "—"}</td>
                  <td className="px-5 py-4 text-muted-foreground">{study.sponsor ?? "—"}</td>
                  <td className="px-5 py-4 text-muted-foreground">{study.is_qct ? "Yes" : "No"}</td>
                  <td className="px-5 py-4">
                    <StatusPill status={study.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
