import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { recordAudit } from "@/lib/audit";
import { draftGridFromDocument } from "@/lib/extraction.functions";
import { RULES_VERSION, summarise, type Payer } from "@/lib/rules-engine";
import { SAMPLE_PROTOCOL_TEXT } from "@/lib/sample-protocol";
import { downloadCsv, printGridPdf, type ExportLine } from "@/lib/grid-export";
import { AiTag, ConfidenceBadge, PayerTag, StatusPill } from "@/components/PayerTag";
import { GridDiff, type DiffLine } from "@/components/GridDiff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/studies/$id")({
  component: StudyWorkspace,
});

interface StudyRow {
  id: string;
  org_id: string;
  protocol_number: string;
  title: string;
  phase: string | null;
  sponsor: string | null;
  is_qct: boolean;
  status: string;
}

interface VersionRow {
  id: string;
  version_number: number;
  status: string;
  rules_version: string;
  created_at: string;
  created_by: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
}

interface LineRow {
  id: string;
  position: number;
  procedure_name: string;
  visit_label: string | null;
  frequency: string | null;
  payer: Payer;
  cpt_code: string | null;
  modifier: string | null;
  confidence: "high" | "medium" | "low";
  needs_review: boolean;
  reviewed: boolean;
  ai_suggested: boolean;
  human_edited: boolean;
  rule_id: string | null;
  rule_citation: string | null;
  rationale: string | null;
  source_citation: unknown;
}

const PAYERS: Payer[] = ["medicare", "sponsor", "patient", "unassigned"];

function StudyWorkspace() {
  const { id } = useParams({ from: "/app/studies/$id" });
  const { profile, user, canApprove, organization } = useAuth();
  const queryClient = useQueryClient();
  const draftFn = useServerFn(draftGridFromDocument);

  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState("");
  const [fileName, setFileName] = useState("protocol.txt");
  const [compareId, setCompareId] = useState<string | null>(null);

  const study = useQuery({
    queryKey: ["study", id],
    queryFn: async (): Promise<StudyRow> => {
      const { data, error } = await supabase
        .from("studies")
        .select("id, org_id, protocol_number, title, phase, sponsor, is_qct, status")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as StudyRow;
    },
  });

  const versions = useQuery({
    queryKey: ["versions", id],
    queryFn: async (): Promise<VersionRow[]> => {
      const { data, error } = await supabase
        .from("grid_versions")
        .select(
          "id, version_number, status, rules_version, created_at, created_by, submitted_by, submitted_at, approved_by, approved_at, notes",
        )
        .eq("study_id", id)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VersionRow[];
    },
  });

  const versionList = versions.data ?? [];
  const currentVersion = versionList.find((v) => v.id === activeVersionId) ?? versionList[0] ?? null;
  const previousVersion =
    currentVersion != null
      ? (versionList.find((v) => v.id === compareId) ??
        versionList.find((v) => v.version_number === currentVersion.version_number - 1) ??
        null)
      : null;

  const lines = useQuery({
    queryKey: ["lines", currentVersion?.id],
    enabled: Boolean(currentVersion?.id),
    queryFn: async (): Promise<LineRow[]> => {
      const { data, error } = await supabase
        .from("grid_lines")
        .select(
          "id, position, procedure_name, visit_label, frequency, payer, cpt_code, modifier, confidence, needs_review, reviewed, ai_suggested, human_edited, rule_id, rule_citation, rationale, source_citation",
        )
        .eq("grid_version_id", currentVersion!.id)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LineRow[];
    },
  });

  const compareLines = useQuery({
    queryKey: ["lines", previousVersion?.id],
    enabled: Boolean(previousVersion?.id),
    queryFn: async (): Promise<LineRow[]> => {
      const { data, error } = await supabase
        .from("grid_lines")
        .select(
          "id, position, procedure_name, visit_label, frequency, payer, cpt_code, modifier, confidence, needs_review, reviewed, ai_suggested, human_edited, rule_id, rule_citation, rationale, source_citation",
        )
        .eq("grid_version_id", previousVersion!.id)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LineRow[];
    },
  });

  const rows = lines.data ?? [];
  const stats = useMemo(() => summarise(rows), [rows]);
  const unreviewed = rows.filter((row) => !row.reviewed).length;
  const editable = currentVersion?.status === "draft";

  /** Draft a new grid version from protocol text: AI extracts, rules engine classifies. */
  const draft = useMutation({
    mutationFn: async () => {
      const record = study.data!;
      const result = (await draftFn({
        data: { document_text: documentText, is_qct: record.is_qct, phase: record.phase },
      })) as Awaited<ReturnType<typeof draftGridFromDocument>>;
      if (!result.ok) throw new Error(result.reason);

      const nextNumber = (versionList[0]?.version_number ?? 0) + 1;

      await supabase.from("documents").insert({
        org_id: record.org_id,
        study_id: record.id,
        type: "protocol",
        file_name: fileName || "protocol.txt",
        extracted_text: documentText.slice(0, 400_000),
        uploaded_by: user?.id ?? null,
      });

      const { data: version, error: versionError } = await supabase
        .from("grid_versions")
        .insert({
          org_id: record.org_id,
          study_id: record.id,
          version_number: nextNumber,
          created_by: user?.id ?? null,
          rules_version: RULES_VERSION,
          status: "draft",
          notes: `Drafted from ${fileName || "protocol.txt"} · model ${result.model}`,
        })
        .select("id, version_number")
        .single();
      if (versionError) throw versionError;

      const { error: linesError } = await supabase.from("grid_lines").insert(
        result.lines.map((line, index) => ({
          org_id: record.org_id,
          grid_version_id: version.id,
          position: index,
          procedure_name: line.procedure_name,
          visit_label: line.visit_label ?? null,
          frequency: line.frequency ?? null,
          payer: line.payer,
          original_payer: line.payer,
          cpt_code: line.cpt_code,
          original_cpt_code: line.cpt_code,
          modifier: line.modifier,
          confidence: line.confidence,
          needs_review: line.needs_review,
          ai_suggested: true,
          rule_id: line.rule_id,
          rule_citation: line.rule_citation,
          rationale: line.rationale,
          source_citation: {
            excerpt: line.source_excerpt ?? null,
            page: line.source_page ?? null,
          } as never,
        })),
      );
      if (linesError) throw linesError;

      await recordAudit({
        org_id: record.org_id,
        actor_id: user?.id ?? "",
        actor_email: profile?.email,
        event_type: "grid.drafted",
        entity_type: "grid_version",
        entity_id: version.id,
        study_id: record.id,
        summary: `Drafted grid v${version.version_number} (${result.lines.length} lines) with rules ${RULES_VERSION}`,
      });

      return version.id;
    },
    onSuccess: (versionId) => {
      setDocumentText("");
      setActiveVersionId(versionId);
      toast.success("Draft grid created. Review every line before submitting.");
      void queryClient.invalidateQueries({ queryKey: ["versions", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateLine = useMutation({
    mutationFn: async ({ line, patch }: { line: LineRow; patch: Partial<LineRow> }) => {
      const { error } = await supabase
        .from("grid_lines")
        .update({
          ...patch,
          human_edited: true,
          edited_by: user?.id ?? null,
          edited_at: new Date().toISOString(),
        } as never)
        .eq("id", line.id);
      if (error) throw error;
      await recordAudit({
        org_id: study.data!.org_id,
        actor_id: user?.id ?? "",
        actor_email: profile?.email,
        event_type: "grid_line.edited",
        entity_type: "grid_line",
        entity_id: line.id,
        study_id: id,
        summary: `Edited "${line.procedure_name}"`,
        before: { payer: line.payer, cpt_code: line.cpt_code, modifier: line.modifier },
        after: patch,
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["lines", currentVersion?.id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleReviewed = useMutation({
    mutationFn: async ({ line, reviewed }: { line: LineRow; reviewed: boolean }) => {
      const { error } = await supabase.from("grid_lines").update({ reviewed }).eq("id", line.id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["lines", currentVersion?.id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const transition = useMutation({
    mutationFn: async (next: "submitted" | "approved") => {
      const version = currentVersion!;
      const patch =
        next === "submitted"
          ? { status: "submitted" as const, submitted_by: user?.id ?? null, submitted_at: new Date().toISOString() }
          : { status: "approved" as const };
      const { error } = await supabase.from("grid_versions").update(patch).eq("id", version.id);
      if (error) throw error;

      if (next === "approved") {
        await supabase
          .from("grid_versions")
          .update({ status: "superseded" })
          .eq("study_id", id)
          .eq("status", "approved")
          .neq("id", version.id);
        await supabase.from("studies").update({ status: "approved" }).eq("id", id);
      } else {
        await supabase.from("studies").update({ status: "in_review" }).eq("id", id);
      }

      await recordAudit({
        org_id: study.data!.org_id,
        actor_id: user?.id ?? "",
        actor_email: profile?.email,
        event_type: next === "approved" ? "grid.approved" : "grid.submitted",
        entity_type: "grid_version",
        entity_id: version.id,
        study_id: id,
        summary:
          next === "approved"
            ? `Approved grid v${version.version_number}`
            : `Submitted grid v${version.version_number} for approval`,
      });
    },
    onSuccess: (_data, next) => {
      toast.success(next === "approved" ? "Grid approved and locked." : "Submitted for approval.");
      void queryClient.invalidateQueries({ queryKey: ["versions", id] });
      void queryClient.invalidateQueries({ queryKey: ["lines", currentVersion?.id] });
    },
    onError: (error: Error) =>
      toast.error(
        error.message.includes("Separation of duties")
          ? "Separation of duties: you cannot approve a grid you submitted."
          : error.message,
      ),
  });

  const revise = useMutation({
    mutationFn: async () => {
      const record = study.data!;
      const source = currentVersion!;
      const nextNumber = (versionList[0]?.version_number ?? 0) + 1;
      const { data: version, error } = await supabase
        .from("grid_versions")
        .insert({
          org_id: record.org_id,
          study_id: record.id,
          version_number: nextNumber,
          created_by: user?.id ?? null,
          rules_version: RULES_VERSION,
          status: "draft",
          notes: `Revision of v${source.version_number}`,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: copyError } = await supabase.from("grid_lines").insert(
        rows.map((line, index) => ({
          org_id: record.org_id,
          grid_version_id: version.id,
          position: index,
          procedure_name: line.procedure_name,
          visit_label: line.visit_label,
          frequency: line.frequency,
          payer: line.payer,
          original_payer: line.payer,
          cpt_code: line.cpt_code,
          original_cpt_code: line.cpt_code,
          modifier: line.modifier,
          confidence: line.confidence,
          needs_review: line.needs_review,
          ai_suggested: line.ai_suggested,
          rule_id: line.rule_id,
          rule_citation: line.rule_citation,
          rationale: line.rationale,
          source_citation: line.source_citation as never,
        })),
      );
      if (copyError) throw copyError;
      return version.id;
    },
    onSuccess: (versionId) => {
      setActiveVersionId(versionId);
      toast.success("New draft version created from the current grid.");
      void queryClient.invalidateQueries({ queryKey: ["versions", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function exportRows(): ExportLine[] {
    return rows.map((line, index) => ({
      position: index,
      procedure_name: line.procedure_name,
      visit_label: line.visit_label,
      frequency: line.frequency,
      cpt_code: line.cpt_code,
      modifier: line.modifier,
      payer: line.payer,
      confidence: line.confidence,
      ai_suggested: line.ai_suggested,
      human_edited: line.human_edited,
      rule_id: line.rule_id,
      rule_citation: line.rule_citation,
      rationale: line.rationale,
    }));
  }

  function exportMeta() {
    const record = study.data!;
    return {
      protocol_number: record.protocol_number,
      title: record.title,
      phase: record.phase,
      sponsor: record.sponsor,
      is_qct: record.is_qct,
      version_number: currentVersion?.version_number ?? 0,
      status: currentVersion?.status ?? "draft",
      rules_version: currentVersion?.rules_version ?? RULES_VERSION,
      approved_at: currentVersion?.approved_at ?? null,
      organization: organization?.name ?? "—",
    };
  }

  if (study.isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-16">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Loading study…</p>
      </main>
    );
  }

  if (study.isError || !study.data) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Study not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may belong to another institution, or it no longer exists.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/app">Back to studies</Link>
        </Button>
      </main>
    );
  }

  const record = study.data;

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <Link to="/app" className="font-mono text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground">
        ← Studies
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-grid-teal uppercase">{record.protocol_number}</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight">{record.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {record.phase ?? "Phase —"} · {record.sponsor ?? "Sponsor —"} ·{" "}
            {record.is_qct ? "Qualifying Clinical Trial" : "Non-qualifying trial"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={currentVersion?.status ?? record.status} />
        </div>
      </div>

      {versionList.length === 0 ? (
        <DraftPanel
          documentText={documentText}
          setDocumentText={setDocumentText}
          fileName={fileName}
          setFileName={setFileName}
          onDraft={() => draft.mutate()}
          pending={draft.isPending}
        />
      ) : (
        <Tabs defaultValue="grid" className="mt-10">
          <TabsList>
            <TabsTrigger value="grid">Billing grid</TabsTrigger>
            <TabsTrigger value="diff">Version diff</TabsTrigger>
            <TabsTrigger value="draft">Draft new version</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <Label className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  Version
                </Label>
                <Select
                  value={currentVersion?.id ?? ""}
                  onValueChange={(value) => setActiveVersionId(value)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {versionList.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        v{version.version_number} · {version.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="font-mono text-xs text-muted-foreground">
                  rules {currentVersion?.rules_version ?? RULES_VERSION}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadCsv(exportMeta(), exportRows())}>
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => printGridPdf(exportMeta(), exportRows())}>
                  Print / PDF
                </Button>
                {currentVersion?.status === "draft" && (
                  <Button
                    size="sm"
                    disabled={unreviewed > 0 || transition.isPending || rows.length === 0}
                    onClick={() => transition.mutate("submitted")}
                  >
                    {unreviewed > 0 ? `${unreviewed} line${unreviewed === 1 ? "" : "s"} unreviewed` : "Submit for approval"}
                  </Button>
                )}
                {currentVersion?.status === "submitted" && canApprove && (
                  <Button size="sm" disabled={transition.isPending} onClick={() => transition.mutate("approved")}>
                    Approve version
                  </Button>
                )}
                {(currentVersion?.status === "approved" || currentVersion?.status === "superseded") && (
                  <Button size="sm" variant="outline" disabled={revise.isPending} onClick={() => revise.mutate()}>
                    Start revision
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              {[
                ["Lines", stats.total],
                ["Medicare", stats.medicare],
                ["Sponsor", stats.sponsor],
                ["Needs review", unreviewed],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border border-border bg-background px-4 py-3">
                  <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{label}</p>
                  <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{value}</p>
                </div>
              ))}
            </div>

            {currentVersion?.status === "submitted" && !canApprove && (
              <p className="rounded-md border border-compliance-amber/30 bg-compliance-amber-soft px-4 py-3 text-sm text-compliance-amber">
                Awaiting approval. Only an approver or admin — and never the person who submitted it — can sign
                this version.
              </p>
            )}

            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border">
                  <tr className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                    <th className="px-4 py-3 font-medium">Reviewed</th>
                    <th className="px-4 py-3 font-medium">Procedure / visit</th>
                    <th className="px-4 py-3 font-medium">Payer</th>
                    <th className="px-4 py-3 font-medium">CPT</th>
                    <th className="px-4 py-3 font-medium">Mod</th>
                    <th className="px-4 py-3 font-medium">Rule &amp; rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((line) => (
                    <tr key={line.id} className="border-b border-border/70 align-top last:border-0">
                      <td className="px-4 py-4">
                        <Checkbox
                          checked={line.reviewed}
                          disabled={!editable}
                          aria-label={`Mark ${line.procedure_name} reviewed`}
                          onCheckedChange={(checked) =>
                            toggleReviewed.mutate({ line, reviewed: checked === true })
                          }
                        />
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium">{line.procedure_name}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {line.visit_label ?? "—"}
                          {line.frequency ? ` · ${line.frequency}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {line.ai_suggested && !line.human_edited && <AiTag />}
                          {line.human_edited && (
                            <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                              Human edited
                            </span>
                          )}
                          <ConfidenceBadge confidence={line.confidence} needsReview={line.needs_review} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {editable ? (
                          <Select
                            value={line.payer}
                            onValueChange={(value) =>
                              updateLine.mutate({ line, patch: { payer: value as Payer } })
                            }
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PAYERS.map((payer) => (
                                <SelectItem key={payer} value={payer}>
                                  {payer}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <PayerTag payer={line.payer} />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {editable ? (
                          <Input
                            defaultValue={line.cpt_code ?? ""}
                            className="w-24 font-mono text-xs"
                            aria-label="CPT code"
                            onBlur={(event) => {
                              const value = event.currentTarget.value.trim() || null;
                              if (value !== (line.cpt_code ?? null))
                                updateLine.mutate({ line, patch: { cpt_code: value } });
                            }}
                          />
                        ) : (
                          <span className="font-mono text-xs">{line.cpt_code ?? "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {editable ? (
                          <Input
                            defaultValue={line.modifier ?? ""}
                            className="w-20 font-mono text-xs"
                            aria-label="Modifier"
                            onBlur={(event) => {
                              const value = event.currentTarget.value.trim() || null;
                              if (value !== (line.modifier ?? null))
                                updateLine.mutate({ line, patch: { modifier: value } });
                            }}
                          />
                        ) : (
                          <span className="font-mono text-xs">{line.modifier ?? "—"}</span>
                        )}
                      </td>
                      <td className="max-w-sm px-4 py-4">
                        <p className="font-mono text-[11px] text-grid-teal">{line.rule_id ?? "—"}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{line.rationale}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground/80">{line.rule_citation}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                  This version has no lines yet.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="diff" className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Label className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Compare against
              </Label>
              <Select value={previousVersion?.id ?? ""} onValueChange={(value) => setCompareId(value)}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select a version" />
                </SelectTrigger>
                <SelectContent>
                  {versionList
                    .filter((version) => version.id !== currentVersion?.id)
                    .map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        v{version.version_number} · {version.status}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {previousVersion ? (
              <GridDiff
                previousLabel={`v${previousVersion.version_number}`}
                nextLabel={`v${currentVersion?.version_number ?? 0}`}
                previous={(compareLines.data ?? []) as DiffLine[]}
                next={rows as DiffLine[]}
              />
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-background px-5 py-10 text-center text-sm text-muted-foreground">
                Only one version exists so far. Diffs appear once a protocol amendment produces a second
                version.
              </p>
            )}
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            <DraftPanel
              documentText={documentText}
              setDocumentText={setDocumentText}
              fileName={fileName}
              setFileName={setFileName}
              onDraft={() => draft.mutate()}
              pending={draft.isPending}
            />
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}

function DraftPanel({
  documentText,
  setDocumentText,
  fileName,
  setFileName,
  onDraft,
  pending,
}: {
  documentText: string;
  setDocumentText: (value: string) => void;
  fileName: string;
  setFileName: (value: string) => void;
  onDraft: () => void;
  pending: boolean;
}) {
  return (
    <div className="mt-10 rounded-lg border border-border bg-background p-6">
      <h2 className="font-display text-xl font-semibold tracking-tight">Draft a grid from the protocol</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Paste the Schedule of Events (or upload a .txt/.md extract). The model transcribes procedures and
        visits verbatim; the deterministic rules engine — not the model — assigns every payer, CPT code and
        modifier. Protocol-level data only, never patient-identifying information.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".txt,.md,.csv,text/plain"
          className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            setFileName(file.name);
            setDocumentText(await file.text());
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFileName("sample-protocol.txt");
            setDocumentText(SAMPLE_PROTOCOL_TEXT);
          }}
        >
          Load sample protocol
        </Button>
      </div>

      <Textarea
        value={documentText}
        onChange={(event) => setDocumentText(event.target.value)}
        rows={14}
        className="mt-4 font-mono text-xs"
        placeholder="Paste the Schedule of Events table here…"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button disabled={pending || documentText.trim().length < 20} onClick={onDraft}>
          {pending ? "Extracting and classifying…" : "Draft billing grid"}
        </Button>
        <span className="font-mono text-xs text-muted-foreground">{fileName}</span>
      </div>
    </div>
  );
}
