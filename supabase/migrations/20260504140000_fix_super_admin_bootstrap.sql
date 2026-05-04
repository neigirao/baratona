-- Re-run super_admin bootstrap idempotente.
-- Necessário caso neigirao@gmail.com tenha feito o primeiro login APÓS a migration anterior.
INSERT INTO public.profiles (id, display_name, created_at)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.email), now()
FROM auth.users u
WHERE u.email = 'neigirao@gmail.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.platform_roles (user_id, role)
SELECT u.id, 'super_admin'
FROM auth.users u
WHERE u.email = 'neigirao@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- has_platform_role é SECURITY DEFINER: pode ser chamada via RPC pelo frontend
-- sem depender de RLS na tabela platform_roles.
GRANT EXECUTE ON FUNCTION public.has_platform_role(uuid, text) TO authenticated;
