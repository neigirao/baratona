-- Fix: get_bar_favorite_counts was created without GRANT TO authenticated
GRANT EXECUTE ON FUNCTION public.get_bar_favorite_counts(uuid) TO authenticated;
