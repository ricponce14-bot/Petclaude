-- supabase/16_fix_wa_messages_schema.sql
-- 1. Agregar nuevos tipos de mensaje al ENUM
-- Nota: En Postgres no se puede usar IF NOT EXISTS con ADD VALUE de forma sencilla, 
-- pero podemos usar una función anónima para evitar errores si ya existen.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bot_incoming') THEN
        ALTER TYPE wa_message_type ADD VALUE 'bot_incoming';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bot_reply') THEN
        ALTER TYPE wa_message_type ADD VALUE 'bot_reply';
    END IF;
END $$;

-- 2. Agregar columna media_url a wa_messages
ALTER TABLE wa_messages ADD COLUMN IF NOT EXISTS media_url text;

-- 3. Agregar columna direction si no existe (la usamos en el código)
ALTER TABLE wa_messages ADD COLUMN IF NOT EXISTS direction text default 'outbound';

-- 4. Refrescar PostgREST
NOTIFY pgrst, 'reload schema';
