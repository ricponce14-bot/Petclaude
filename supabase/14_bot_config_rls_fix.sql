-- supabase/14_bot_config_rls_fix.sql
-- Arreglo a las políticas de seguridad (RLS) para permitir guardar la configuración del bot 
-- y las sesiones de chat con ambos metadatos (app_metadata o user_metadata).
-- Corrige el error: "new row violates row-level security policy for table bot_config"

-- 1. Arreglar políticas de bot_config
DROP POLICY IF EXISTS "tenant_isolation_select" ON bot_config;
CREATE POLICY "tenant_isolation_select" ON bot_config
  FOR SELECT USING (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

DROP POLICY IF EXISTS "tenant_isolation_insert" ON bot_config;
CREATE POLICY "tenant_isolation_insert" ON bot_config
  FOR INSERT WITH CHECK (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

DROP POLICY IF EXISTS "tenant_isolation_update" ON bot_config;
CREATE POLICY "tenant_isolation_update" ON bot_config
  FOR UPDATE USING (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

-- 2. Arreglar políticas de whatsapp_chat_sessions (para prevenir fallos en chat en vivo)
DROP POLICY IF EXISTS "tenant_isolation" ON whatsapp_chat_sessions;
CREATE POLICY "tenant_isolation" ON whatsapp_chat_sessions
  USING (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

DROP POLICY IF EXISTS "tenant_isolation_insert" ON whatsapp_chat_sessions;
CREATE POLICY "tenant_isolation_insert" ON whatsapp_chat_sessions
  FOR INSERT WITH CHECK (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

-- 3. Refrescar el esquema
NOTIFY pgrst, 'reload schema';
