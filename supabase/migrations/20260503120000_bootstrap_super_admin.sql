-- Bootstrap super_admin role for neigirao@gmail.com
-- Idempotent: ON CONFLICT DO NOTHING

-- Ensure profile exists first (may not exist if user never logged in via platform)
INSERT INTO public.profiles (id, display_name, created_at)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.email), now()
FROM auth.users u
WHERE u.email = 'neigirao@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Grant super_admin role
INSERT INTO public.platform_roles (user_id, role)
SELECT u.id, 'super_admin'
FROM auth.users u
WHERE u.email = 'neigirao@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
