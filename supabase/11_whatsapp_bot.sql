-- supabase/11_whatsapp_bot.sql
-- Migración para el sistema de bot conversacional de WhatsApp

-- ============================================================
-- 1. TABLA: whatsapp_chat_sessions (Estado de conversación)
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_chat_sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone             TEXT NOT NULL,
  owner_id          UUID REFERENCES owners(id) ON DELETE SET NULL,
  state             TEXT NOT NULL DEFAULT 'inicio',
  -- Datos temporales del flujo de reserva
  selected_service  TEXT,
  selected_date     DATE,
  selected_time     TIME,
  selected_pet_id   UUID REFERENCES pets(id) ON DELETE SET NULL,
  -- Metadata
  last_message_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_lookup 
  ON whatsapp_chat_sessions(phone, tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_active 
  ON whatsapp_chat_sessions(expires_at) 
  WHERE state != 'finalizado';

-- ============================================================
-- 2. TABLA: bot_config (Configuración del bot por negocio)
-- ============================================================
CREATE TABLE IF NOT EXISTS bot_config (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  is_enabled            BOOLEAN DEFAULT FALSE,
  welcome_message       TEXT DEFAULT '¡Hola! 🐾 Bienvenido. ¿En qué podemos ayudarte?

1️⃣ Agendar cita
2️⃣ Ver precios
3️⃣ Hablar con un asesor',
  services              JSONB DEFAULT '[
    {"key": "bath", "label": "Baño", "duration_min": 60, "price": 350},
    {"key": "haircut", "label": "Corte", "duration_min": 90, "price": 450},
    {"key": "bath_haircut", "label": "Baño + Corte", "duration_min": 120, "price": 600}
  ]'::jsonb,
  business_hours        JSONB DEFAULT '{
    "lun": {"open": "09:00", "close": "18:00"},
    "mar": {"open": "09:00", "close": "18:00"},
    "mie": {"open": "09:00", "close": "18:00"},
    "jue": {"open": "09:00", "close": "18:00"},
    "vie": {"open": "09:00", "close": "18:00"},
    "sab": {"open": "09:00", "close": "14:00"},
    "dom": null
  }'::jsonb,
  slot_duration_min     INT DEFAULT 60,
  confirmation_template TEXT DEFAULT '✅ ¡Cita confirmada!

📋 Servicio: {servicio}
📅 Fecha: {fecha}
🕐 Hora: {hora}

¡Te esperamos! 🐕',
  price_list_message    TEXT DEFAULT '💰 Nuestros precios:

{lista_precios}

Escribe *1* para agendar una cita
Escribe *0* para volver al menú',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para auto-actualizar updated_at
DROP TRIGGER IF EXISTS set_bot_config_updated_at ON bot_config;
CREATE TRIGGER set_bot_config_updated_at
  BEFORE UPDATE ON bot_config
  FOR EACH ROW
  EXECUTE FUNCTION auto_updated_at();

-- ============================================================
-- 3. MODIFICAR wa_messages: agregar dirección (inbound/outbound)
-- ============================================================
ALTER TABLE wa_messages 
  ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound';

-- ============================================================
-- 4. EXTENDER el enum wa_message_type para incluir bot
-- ============================================================
ALTER TYPE wa_message_type ADD VALUE IF NOT EXISTS 'bot_reply';
ALTER TYPE wa_message_type ADD VALUE IF NOT EXISTS 'bot_incoming';

-- ============================================================
-- 5. RLS para las nuevas tablas
-- ============================================================
ALTER TABLE whatsapp_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_config ENABLE ROW LEVEL SECURITY;

-- Chat sessions: tenant isolation
DROP POLICY IF EXISTS "tenant_isolation" ON whatsapp_chat_sessions;
CREATE POLICY "tenant_isolation" ON whatsapp_chat_sessions
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS "tenant_isolation_insert" ON whatsapp_chat_sessions;
CREATE POLICY "tenant_isolation_insert" ON whatsapp_chat_sessions
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Bot config: tenant isolation (SELECT + INSERT + UPDATE)
DROP POLICY IF EXISTS "tenant_isolation_select" ON bot_config;
CREATE POLICY "tenant_isolation_select" ON bot_config
  FOR SELECT USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS "tenant_isolation_insert" ON bot_config;
CREATE POLICY "tenant_isolation_insert" ON bot_config
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS "tenant_isolation_update" ON bot_config;
CREATE POLICY "tenant_isolation_update" ON bot_config
  FOR UPDATE USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- También necesitamos policy de service_role bypass para el webhook
-- (El webhook usa supabaseAdmin con service_role, que bypasea RLS automáticamente)

-- ============================================================
-- 6. ÍNDICE en wa_messages para dirección
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_wa_direction ON wa_messages(direction);

-- Recargar schema cache
NOTIFY pgrst, 'reload schema';
