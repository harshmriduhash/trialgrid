<div align="center">

# TrialGrid

### Medicare Coverage Analysis that survives an audit.

**AI reads the protocol. A deterministic rules engine decides. A named human approves every line.**

`CMS NCD 310.1` · `TanStack Start` · `React 19` · `Postgres + RLS` · `Lovable AI Gateway`

</div>

---

## Summary

TrialGrid turns a clinical trial protocol into a **billing grid** — the legal document that says, procedure by procedure and visit by visit, who pays: Medicare, the sponsor, or the patient. Today that document is produced by an analyst reading 120 pages and typing into a spreadsheet, over three to six weeks, leaving no record of *why* each decision was made.

TrialGrid produces the same document in under a day, with a rule citation and a protocol excerpt attached to every line, and an append-only audit trail behind it.

## The problem

| Reality today | Consequence |
| --- | --- |
| Protocols are read by humans, retyped into Excel | 3–6 weeks per study; amendments restart the work |
| Coverage judgment lives in someone's head | Nobody can reconstruct the reasoning six months later |
| Mis-billing research costs to Medicare | False Claims Act exposure — sites have settled for millions |

## How TrialGrid solves it

```
Protocol text ──▶ [ LLM extraction ] ──▶ structured procedures (verbatim)
                        │  never emits a payer, CPT, or modifier
                        ▼
              [ Deterministic rules engine ]  ← CMS NCD 310.1, CPT reference
                        │  payer + CPT + modifier + rule ID + citation
                        ▼
              [ Human review & approval ]  ← separation of duties, DB-enforced
                        │
                        ▼
        Immutable approved version ──▶ CSV / PDF export + audit trail
```

The split is the product: **the model never decides coverage.** It transcribes. Every payer assignment comes from a versioned, testable, deterministic rules engine (`src/lib/rules-engine.ts`, 18 unit tests) whose output is reproducible and citable.

### Does it save time and money?

- **Time:** 3–6 weeks of analyst work → under a day of review. Amendments become a diff, not a rewrite.
- **Money:** a mid-size site running 40 analyses per year spends roughly 1,600 analyst hours on coverage analysis. Cutting review time by ~80% frees the equivalent of a full-time analyst.
- **Risk:** the expensive failure isn't the labour, it's one research-only procedure billed to Medicare. Every line here carries its rule and its approver.

---

## Software architecture

### High-level design (HLD)

```
┌─────────────────────────── Browser (React 19) ───────────────────────────┐
│  Marketing routes        Workspace (/app)                                │
│  / how-it-works          studies · grid editor · version diff · exports  │
└───────────────┬───────────────────────────────┬──────────────────────────┘
                │ RLS-scoped Data API           │ typed RPC (createServerFn)
                ▼                               ▼
┌───────────────────────────┐      ┌────────────────────────────────────────┐
│  Postgres (Lovable Cloud) │      │  Server runtime (edge)                 │
│  orgs · profiles · roles  │      │  extraction.functions.ts (auth mw)     │
│  studies · documents      │◀─────│  extraction.server.ts → AI Gateway     │
│  grid_versions/lines      │      │  rules-engine.ts (deterministic)       │
│  audit_events · ncd_rules │      └────────────────────────────────────────┘
│  RLS + triggers + roles   │
└───────────────────────────┘
```

### Low-level design (LLD)

**Data model**

```
organizations 1─┬─* profiles ──* user_roles(admin|approver|analyst)
                └─* studies ──┬─* documents (protocol|icf|budget)
                              └─* grid_versions (draft|submitted|approved|superseded)
                                     └─* grid_lines (payer, cpt, modifier, rule_id,
                                                     citation, confidence, reviewed,
                                                     ai_suggested, human_edited)
audit_events (append-only, org-scoped, actor + before/after)
```

**Enforcement lives in the database, not the UI**

| Guarantee | Mechanism |
| --- | --- |
| Tenant isolation | RLS on every table via `current_org_id()` |
| Privilege escalation safety | Roles in `user_roles`, checked by `SECURITY DEFINER has_role()` |
| Separation of duties | `enforce_grid_version_immutability()` rejects self-approval |
| Immutability of approved grids | Trigger blocks edits/inserts/deletes on approved versions |
| Audit integrity | `audit_events` grants INSERT/SELECT only |

**Rules engine contract** — `classifyProcedure(input, ctx) → { payer, cpt_code, modifier, confidence, rule_id, rule_citation, rationale, needs_review }`, keyed to `RULES_VERSION` so a grid can always be re-derived exactly as it was approved.

**Key paths**

```
src/lib/rules-engine.ts        deterministic classifier + CPT reference + tests
src/lib/extraction.server.ts   LLM extraction under a strict Zod schema
src/lib/extraction.functions.ts authenticated server function wrapper
src/lib/grid-export.ts         CSV + print-to-PDF exports
src/lib/audit.ts               append-only audit writes
src/components/GridDiff.tsx    version diff viewer
src/routes/app.*               authenticated workspace
```

---

## Development

### Shipped
- Marketing site, auth with idle timeout, org/role bootstrap on sign-up
- Study creation, protocol ingestion (paste / .txt / sample), AI extraction
- Deterministic NCD 310.1 classification with citations and confidence
- Line-level review and editing, reviewed-gating before submission
- Draft → submit → approve workflow with DB-enforced separation of duties
- Immutable approved versions, revisions, superseding
- Version diff viewer, CSV + PDF export, append-only audit trail
- Pilot request capture and admin inbox

### Pending
- Native PDF/DOCX protocol parsing (text extract required today)
- Coverage of ICF and budget documents in the same pipeline
- Bulk CPT catalogue import and site-specific fee schedules

### Next
- SSO/SAML and enterprise provisioning
- Amendment auto-detection with proposed diffs
- Integrations with Huron / START / IRIS billing systems
- Analytics on payer mix and reviewer throughput

### Run locally

```sh
npm i
npm run dev
```

Checklists: `LAUNCH_CHECKLIST.md`, `PRODUCTION_CHECKLIST.md`, `MVP_LAUNCH_CHECKLIST.md`, `EXECUTION_CHECKLIST.md`, `READY_CHECKLIST.md`.

> TrialGrid operates on protocol-level data only. Never enter patient-identifying information.
