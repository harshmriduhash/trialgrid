/**
 * Server-only extraction helpers. The LLM is used for ONE job: turning an
 * unstructured Schedule of Events into a structured procedure list under a
 * strict schema. It never produces a payer, CPT code, or modifier — that is
 * the deterministic rules engine's exclusive write path (PRD §7.4).
 */
import { z } from "zod";
import { classifyAll, type ClassifiedLine } from "./rules-engine";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.5-flash";

export const ProcedureSchema = z.object({
  procedure_name: z.string().min(1).max(200),
  visit_label: z.string().max(120).nullable().optional(),
  frequency: z.string().max(120).nullable().optional(),
  notes: z.string().max(600).nullable().optional(),
  source_excerpt: z.string().max(600).nullable().optional(),
  source_page: z.number().int().nullable().optional(),
});

export const ExtractionSchema = z.object({
  procedures: z.array(ProcedureSchema).max(400),
});

export type ExtractionResult =
  | { ok: true; lines: ClassifiedLine[]; model: string }
  | { ok: false; reason: string };

const SYSTEM_PROMPT = `You are a clinical trial protocol extraction engine for a Medicare coverage analysis system.

Your ONLY job is to transcribe the Schedule of Events / Schedule of Assessments into a structured list of procedure-and-visit pairs.

Hard rules:
- NEVER decide or output a payer, CPT code, modifier, or coverage determination. A separate deterministic rules engine does that.
- Emit one entry per procedure PER VISIT where the schedule marks it as performed.
- Copy the procedure wording from the document; do not normalise or invent clinical terms.
- In "notes", record any protocol qualifier that affects coverage: "research only", "for eligibility", "additional to standard of care", "PK sample", "central lab", frequency deviations.
- In "source_excerpt", quote the short verbatim span the entry came from so a human reviewer can verify it.
- Exclude anything patient-identifying. Operate on protocol-level data only.
- If the document contains no schedule of events, return an empty procedures array.`;

function stripCodeFence(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced ? fenced[1] : raw).trim();
}

async function callGateway(apiKey: string, documentText: string) {
  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract the Schedule of Events from the protocol text below.\n\nRespond with JSON only, in this exact shape:\n{"procedures":[{"procedure_name":"","visit_label":"","frequency":"","notes":"","source_excerpt":"","source_page":null}]}\n\nPROTOCOL TEXT:\n"""\n${documentText.slice(0, 120_000)}\n"""`,
        },
      ],
    }),
  });

  if (response.status === 429) throw new Error("RATE_LIMIT");
  if (response.status === 402) throw new Error("CREDITS");
  if (!response.ok) throw new Error(`GATEWAY_${response.status}`);

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return payload.choices?.[0]?.message?.content ?? "";
}

export async function extractAndClassify(
  documentText: string,
  context: { is_qct: boolean; phase?: string | null },
): Promise<ExtractionResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return { ok: false, reason: "AI extraction is not configured. Enter the grid manually." };
  }

  let content = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      content = await callGateway(apiKey, documentText);
      const parsed = ExtractionSchema.safeParse(JSON.parse(stripCodeFence(content)));
      if (parsed.success) {
        if (parsed.data.procedures.length === 0) {
          return {
            ok: false,
            reason:
              "No Schedule of Events could be located in this document. Enter the grid manually or upload the protocol section containing the schedule table.",
          };
        }
        return {
          ok: true,
          model: MODEL,
          lines: classifyAll(parsed.data.procedures, context),
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN";
      if (message === "RATE_LIMIT") {
        return { ok: false, reason: "Extraction is rate-limited right now. Retry in a minute, or enter the grid manually." };
      }
      if (message === "CREDITS") {
        return { ok: false, reason: "AI extraction credits are exhausted for this workspace. Manual entry is unaffected." };
      }
      if (attempt === 1) {
        return { ok: false, reason: "AI extraction unavailable — the document could not be parsed. Enter the grid manually." };
      }
    }
  }

  // Schema validation failed twice: route to manual entry, never guess (§7.2).
  return {
    ok: false,
    reason: "AI extraction returned output that failed schema validation twice. Routed to manual entry rather than guessing.",
  };
}
