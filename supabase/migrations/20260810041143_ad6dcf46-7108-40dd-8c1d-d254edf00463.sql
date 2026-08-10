CREATE POLICY "org members read own documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'study-documents' AND (storage.foldername(name))[1] = public.current_org_id()::text);
CREATE POLICY "org members upload own documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'study-documents' AND (storage.foldername(name))[1] = public.current_org_id()::text);
CREATE POLICY "org members delete own documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'study-documents' AND (storage.foldername(name))[1] = public.current_org_id()::text);