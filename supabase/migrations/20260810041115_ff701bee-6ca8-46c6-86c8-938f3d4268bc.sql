REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_grid_version_immutability() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_grid_line_immutability() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_approve(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM anon, public;