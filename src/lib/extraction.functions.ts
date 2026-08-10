import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { extractAndClassify } from "./extraction.server";

const InputSchema = z.object({
  document_text: z.string().min(20).max(400_000),
  is_qct: z.boolean(),
  phase: z.string().nullable().optional(),
});

export const draftGridFromDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) =>
    extractAndClassify(data.document_text, {
      is_qct: data.is_qct,
      phase: data.phase ?? null,
    }),
  );
