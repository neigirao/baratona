-- Fix: grant EXECUTE on RPCs used by /minhas-baratonas
-- get_events_by_owner and get_events_joined_by_user were created without
-- GRANT TO authenticated, so PostgREST blocked all calls from the frontend.

GRANT EXECUTE ON FUNCTION public.get_events_by_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_events_joined_by_user(uuid) TO authenticated;
