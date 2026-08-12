# TrialGrid — Launch Checklist (beta)

## Product
- [x] Marketing site: home, how it works, security & compliance, pricing, glossary, request a pilot
- [x] Auth: email/password sign-up + sign-in, 30-minute idle auto sign-out
- [x] Study creation with QCT flag, phase, sponsor
- [x] Protocol ingestion (paste / .txt upload / sample protocol)
- [x] AI extraction (schedule of events only — never payer/CPT decisions)
- [x] Deterministic NCD 310.1 rules engine assigns payer, CPT, modifier + citation
- [x] Line-level review, edit, and reviewed-checkbox gating
- [x] Draft → submitted → approved workflow with DB-enforced separation of duties
- [x] Immutable approved versions (DB triggers), superseding on new approval
- [x] Version diff viewer (added / removed / reclassified)
- [x] CSV and print-to-PDF export with rules version and citations
- [x] Append-only audit events on every state change
- [x] Pilot request inbox for admins
- [ ] PDF/DOCX protocol parsing (text extract required today)
- [ ] SSO / SAML for enterprise sites

## Compliance
- [x] RLS on every table, org-scoped via `current_org_id()`
- [x] Roles in a separate `user_roles` table with `has_role()` / `can_approve()`
- [x] Audit table is insert/select only from the app role
- [x] No PHI by design — protocol-level data only, stated in UI copy
- [ ] Signed BAA template and completed security questionnaire per pilot site
- [ ] Third-party penetration test

## Pre-launch ops
- [ ] Run the security scan and clear all critical findings
- [ ] Verify email confirmation flow on the production domain
- [ ] Configure custom domain and publish
- [ ] Seed `ncd_rules` reference rows for the current rules version
- [ ] Named on-call owner for pilot support
