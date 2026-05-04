-- Allow unauthenticated users to call get_public_events_with_counts so that
-- special circuit cards appear on the home page without requiring login.
-- The function is SECURITY DEFINER and already filters WHERE visibility = 'public',
-- so granting anon execute is safe.
GRANT EXECUTE ON FUNCTION public.get_public_events_with_counts() TO anon;
