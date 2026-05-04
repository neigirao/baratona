-- Revoke EXECUTE from anon on functions that require an authenticated user.
REVOKE EXECUTE ON FUNCTION public.admin_list_all_events() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_platform_roles() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_remove_platform_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_platform_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_event_owner(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_baratona_from_favorites(uuid, text, uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_event_invite(text, text) FROM anon;

-- Make sure authenticated still has it
GRANT EXECUTE ON FUNCTION public.admin_list_all_events() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_platform_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_platform_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_platform_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_event_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_baratona_from_favorites(uuid, text, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_event_invite(text, text) TO authenticated;