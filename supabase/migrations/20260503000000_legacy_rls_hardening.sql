-- Harden RLS policies for legacy tables (participants, bars, app_config)
-- These tables serve the /nei route and should only be writable by super_admins.

-- Enable RLS on legacy tables (idempotent)
ALTER TABLE IF EXISTS participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_config ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies before recreating
DROP POLICY IF EXISTS "Allow all on participants" ON participants;
DROP POLICY IF EXISTS "Allow all on bars" ON bars;
DROP POLICY IF EXISTS "Allow all on app_config" ON app_config;

-- participants: anyone can read, only super_admin can write
CREATE POLICY "participants_select_all"
  ON participants FOR SELECT USING (true);

CREATE POLICY "participants_write_super_admin"
  ON participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM platform_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- bars (legacy): anyone can read, only super_admin can write
CREATE POLICY "legacy_bars_select_all"
  ON bars FOR SELECT USING (true);

CREATE POLICY "legacy_bars_write_super_admin"
  ON bars FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM platform_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- app_config (legacy): anyone can read, only super_admin can write
CREATE POLICY "legacy_app_config_select_all"
  ON app_config FOR SELECT USING (true);

CREATE POLICY "legacy_app_config_write_super_admin"
  ON app_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM platform_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );
