CREATE TYPE public.app_role AS ENUM ('admin','approver','analyst');
CREATE TYPE public.study_status AS ENUM ('draft','in_review','approved');
CREATE TYPE public.doc_type AS ENUM ('protocol','icf','budget');
CREATE TYPE public.grid_status AS ENUM ('draft','submitted','approved','superseded');
CREATE TYPE public.payer_type AS ENUM ('medicare','sponsor','patient','unassigned');
CREATE TYPE public.confidence_level AS ENUM ('high','medium','low');

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text,
  title text,
  deactivated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_org_email_idx ON public.profiles(org_id, email);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.can_approve(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','approver'));
$$;

CREATE POLICY "org members read their org" ON public.organizations FOR SELECT TO authenticated
  USING (id = public.current_org_id());
CREATE POLICY "authenticated can create org" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "admins update their org" ON public.organizations FOR UPDATE TO authenticated
  USING (id = public.current_org_id() AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR org_id = public.current_org_id());
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR (org_id = public.current_org_id() AND public.has_role(auth.uid(),'admin')));

CREATE POLICY "read roles in org" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR org_id = public.current_org_id());
CREATE POLICY "bootstrap own role" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR (org_id = public.current_org_id() AND public.has_role(auth.uid(),'admin')));
CREATE POLICY "admins manage roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (org_id = public.current_org_id() AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (org_id = public.current_org_id() AND public.has_role(auth.uid(),'admin') AND user_id <> auth.uid());

CREATE TABLE public.studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  protocol_number text NOT NULL,
  title text NOT NULL,
  phase text,
  sponsor text,
  is_qct boolean NOT NULL DEFAULT true,
  status public.study_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX studies_org_idx ON public.studies(org_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studies TO authenticated;
GRANT ALL ON public.studies TO service_role;
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read studies" ON public.studies FOR SELECT TO authenticated
  USING (org_id = public.current_org_id());
CREATE POLICY "org members create studies" ON public.studies FOR INSERT TO authenticated
  WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "org members update studies" ON public.studies FOR UPDATE TO authenticated
  USING (org_id = public.current_org_id());
CREATE POLICY "admins delete studies" ON public.studies FOR DELETE TO authenticated
  USING (org_id = public.current_org_id() AND public.has_role(auth.uid(),'admin'));

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  type public.doc_type NOT NULL,
  file_name text NOT NULL,
  storage_key text,
  page_count int,
  extracted_text text,
  version int NOT NULL DEFAULT 1,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX documents_study_type_idx ON public.documents(study_id, type);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read documents" ON public.documents FOR SELECT TO authenticated
  USING (org_id = public.current_org_id());
CREATE POLICY "org members write documents" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "org members update documents" ON public.documents FOR UPDATE TO authenticated
  USING (org_id = public.current_org_id());
CREATE POLICY "org members delete documents" ON public.documents FOR DELETE TO authenticated
  USING (org_id = public.current_org_id());

CREATE TABLE public.grid_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  status public.grid_status NOT NULL DEFAULT 'draft',
  rules_version text NOT NULL DEFAULT 'ncd-310.1-2024.1',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  submitted_by uuid REFERENCES auth.users(id),
  submitted_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (study_id, version_number)
);
CREATE INDEX grid_versions_study_idx ON public.grid_versions(study_id, version_number DESC);
GRANT SELECT, INSERT, UPDATE ON public.grid_versions TO authenticated;
GRANT ALL ON public.grid_versions TO service_role;
ALTER TABLE public.grid_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read grid versions" ON public.grid_versions FOR SELECT TO authenticated
  USING (org_id = public.current_org_id());
CREATE POLICY "org members create grid versions" ON public.grid_versions FOR INSERT TO authenticated
  WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "org members update grid versions" ON public.grid_versions FOR UPDATE TO authenticated
  USING (org_id = public.current_org_id());

CREATE TABLE public.grid_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  grid_version_id uuid NOT NULL REFERENCES public.grid_versions(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  procedure_name text NOT NULL,
  visit_label text,
  frequency text,
  cpt_code text,
  modifier text,
  payer public.payer_type NOT NULL DEFAULT 'unassigned',
  ai_suggested boolean NOT NULL DEFAULT false,
  confidence public.confidence_level NOT NULL DEFAULT 'low',
  rationale text,
  rule_id text,
  rule_citation text,
  source_citation jsonb,
  needs_review boolean NOT NULL DEFAULT true,
  reviewed boolean NOT NULL DEFAULT false,
  human_edited boolean NOT NULL DEFAULT false,
  original_payer public.payer_type,
  original_cpt_code text,
  edited_by uuid REFERENCES auth.users(id),
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX grid_lines_version_idx ON public.grid_lines(grid_version_id, position);
CREATE INDEX grid_lines_cpt_idx ON public.grid_lines(cpt_code);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grid_lines TO authenticated;
GRANT ALL ON public.grid_lines TO service_role;
ALTER TABLE public.grid_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read grid lines" ON public.grid_lines FOR SELECT TO authenticated
  USING (org_id = public.current_org_id());
CREATE POLICY "org members create grid lines" ON public.grid_lines FOR INSERT TO authenticated
  WITH CHECK (org_id = public.current_org_id());
CREATE POLICY "org members update grid lines" ON public.grid_lines FOR UPDATE TO authenticated
  USING (org_id = public.current_org_id());
CREATE POLICY "org members delete grid lines" ON public.grid_lines FOR DELETE TO authenticated
  USING (org_id = public.current_org_id());

CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  actor_email text,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  study_id uuid,
  summary text,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_org_idx ON public.audit_events(org_id, created_at DESC);
CREATE INDEX audit_events_entity_idx ON public.audit_events(entity_type, entity_id);
CREATE INDEX audit_events_study_idx ON public.audit_events(study_id, created_at DESC);
GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT SELECT, INSERT ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read audit" ON public.audit_events FOR SELECT TO authenticated
  USING (org_id = public.current_org_id());
CREATE POLICY "org members append audit" ON public.audit_events FOR INSERT TO authenticated
  WITH CHECK (org_id = public.current_org_id() AND actor_id = auth.uid());

CREATE TABLE public.ncd_rules (
  id text PRIMARY KEY,
  rule_version text NOT NULL,
  effective_date date NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  citation text NOT NULL,
  default_payer public.payer_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ncd_rules TO authenticated;
GRANT SELECT ON public.ncd_rules TO anon;
GRANT ALL ON public.ncd_rules TO service_role;
ALTER TABLE public.ncd_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rules are public reference" ON public.ncd_rules FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.pilot_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  institution text NOT NULL,
  role text,
  studies_per_year text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.pilot_requests TO anon, authenticated;
GRANT SELECT ON public.pilot_requests TO authenticated;
GRANT ALL ON public.pilot_requests TO service_role;
ALTER TABLE public.pilot_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can request a pilot" ON public.pilot_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "authenticated read pilot requests" ON public.pilot_requests FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.enforce_grid_version_immutability()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'approved' AND NEW.status <> 'superseded' THEN
    RAISE EXCEPTION 'Approved grid versions are immutable';
  END IF;
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    IF NOT public.can_approve(auth.uid()) THEN
      RAISE EXCEPTION 'Only approvers or admins can approve a grid';
    END IF;
    IF OLD.submitted_by IS NOT NULL AND OLD.submitted_by = auth.uid() THEN
      RAISE EXCEPTION 'Separation of duties: you cannot approve a grid you submitted';
    END IF;
    NEW.approved_by := auth.uid();
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER grid_versions_immutability BEFORE UPDATE ON public.grid_versions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_grid_version_immutability();

CREATE OR REPLACE FUNCTION public.enforce_grid_line_immutability()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status public.grid_status;
BEGIN
  SELECT status INTO v_status FROM public.grid_versions
    WHERE id = COALESCE(NEW.grid_version_id, OLD.grid_version_id);
  IF v_status = 'approved' THEN
    RAISE EXCEPTION 'Lines in an approved grid version cannot be changed';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER grid_lines_immutability BEFORE INSERT OR UPDATE OR DELETE ON public.grid_lines
  FOR EACH ROW EXECUTE FUNCTION public.enforce_grid_line_immutability();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org uuid; v_org_name text;
BEGIN
  v_org_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'org_name',''), split_part(NEW.email,'@',2));
  INSERT INTO public.organizations (name, domain)
    VALUES (v_org_name, split_part(NEW.email,'@',2)) RETURNING id INTO v_org;
  INSERT INTO public.profiles (id, org_id, email, full_name, title)
    VALUES (NEW.id, v_org, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'title');
  INSERT INTO public.user_roles (user_id, org_id, role) VALUES (NEW.id, v_org, 'admin');
  INSERT INTO public.user_roles (user_id, org_id, role) VALUES (NEW.id, v_org, 'approver');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.ncd_rules (id, rule_version, effective_date, title, description, citation, default_payer) VALUES
('QCT-GATE','ncd-310.1-2024.1','2024-01-01','Qualifying Clinical Trial gate','A trial must meet the QCT criteria of NCD 310.1 before any routine cost is billable to Medicare.','CMS NCD 310.1 §2','unassigned'),
('ROUTINE-SOC','ncd-310.1-2024.1','2024-01-01','Routine cost — standard of care','Items and services typically provided absent a clinical trial are routine costs billable to Medicare.','CMS NCD 310.1 §2.1','medicare'),
('ROUTINE-MONITOR','ncd-310.1-2024.1','2024-01-01','Routine cost — monitoring of an investigational item','Services required solely for the provision of the investigational item, and reasonably necessary monitoring, are routine costs.','CMS NCD 310.1 §2.1(b)','medicare'),
('ROUTINE-COMPLICATION','ncd-310.1-2024.1','2024-01-01','Routine cost — complication management','Care for complications arising from provision of the investigational item is a routine cost.','CMS NCD 310.1 §2.1(c)','medicare'),
('RESEARCH-INVESTIGATIONAL','ncd-310.1-2024.1','2024-01-01','Investigational item or service','The investigational item itself is never a routine cost and is sponsor responsibility unless separately covered.','CMS NCD 310.1 §2.2(a)','sponsor'),
('RESEARCH-DATA-ONLY','ncd-310.1-2024.1','2024-01-01','Data collection only','Services provided solely to satisfy data collection and analysis needs are not routine costs.','CMS NCD 310.1 §2.2(b)','sponsor'),
('RESEARCH-FREQUENCY','ncd-310.1-2024.1','2024-01-01','Frequency exceeds standard of care','Standard-of-care services performed more frequently than clinically indicated are research costs for the excess visits.','CMS NCD 310.1 §2.2(b)','sponsor'),
('RESEARCH-SCREEN-FAIL','ncd-310.1-2024.1','2024-01-01','Eligibility / screening-only testing','Testing performed solely to determine trial eligibility is not a routine cost.','CMS NCD 310.1 §2.2(b)','sponsor'),
('PATIENT-STANDARD-COST','ncd-310.1-2024.1','2024-01-01','Patient responsibility','Routine costs billed to Medicare remain subject to normal deductible and coinsurance, which are patient responsibility.','CMS NCD 310.1 §3','patient'),
('MANUAL-REVIEW','ncd-310.1-2024.1','2024-01-01','Outside current rule coverage','The engine has no matching rule; the line must be classified by a human reviewer.','TrialGrid rules engine','unassigned');