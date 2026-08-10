import { supabase } from "@/integrations/supabase/client";

export interface AuditInput {
  org_id: string;
  actor_id: string;
  actor_email?: string | null;
  event_type: string;
  entity_type: string;
  entity_id?: string | null;
  study_id?: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
}

/**
 * Append-only audit write. The audit table grants only SELECT/INSERT to the
 * application role, so entries can never be edited or removed from the app.
 */
export async function recordAudit(input: AuditInput) {
  const { error } = await supabase.from("audit_events").insert({
    org_id: input.org_id,
    actor_id: input.actor_id,
    actor_email: input.actor_email ?? null,
    event_type: input.event_type,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? null,
    study_id: input.study_id ?? null,
    summary: input.summary,
    before: (input.before ?? null) as never,
    after: (input.after ?? null) as never,
  });
  if (error) console.error("audit write failed", error);
}
