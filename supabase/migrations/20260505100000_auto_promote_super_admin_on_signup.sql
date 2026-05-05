-- Trigger que promove neigirao@gmail.com a super_admin automaticamente
-- no primeiro login (INSERT em auth.users pelo OAuth do Google).
-- Necessário porque a migration de bootstrap roda antes do primeiro login,
-- quando auth.users ainda não tem a linha do usuário.

CREATE OR REPLACE FUNCTION public.handle_super_admin_bootstrap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'neigirao@gmail.com' THEN
    INSERT INTO public.profiles (user_id, display_name, avatar_url, created_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.raw_user_meta_data->>'avatar_url',
      now()
    )
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.platform_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_super_admin ON auth.users;

CREATE TRIGGER on_auth_user_created_super_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_super_admin_bootstrap();
