-- supabase/12_bot_phase3_cron.sql
-- Fase 3: Mejoras al cron job de recordatorios para hacerlos interactivos

-- 1. Deshabilitar el cron actual
SELECT cron.unschedule('reminder-24h');

-- 2. Reprogramar con la lógica del bot
SELECT cron.schedule(
  'reminder-24h',
  '0 * * * *',   -- cada hora en punto
  $$
  -- A. Recordatorios con opciones interactivas (Para negocios con bot activado)
  WITH reminders AS (
    SELECT
      a.tenant_id,
      a.owner_id,
      a.pet_id,
      a.id as appt_id,
      o.whatsapp as phone,
      replace(
        replace(
          replace(mt.body, '{owner_name}', o.name),
          '{pet_name}', p.name
        ),
        '{time}', to_char(a.scheduled_at at time zone 'America/Mexico_City', 'HH12:MI AM')
      ) || E'\n\nResponde:\n1️⃣ Para *confirmar*\n2️⃣ Para *cancelar*\n3️⃣ Para *reagendar*' as final_body
    FROM appointments a
    JOIN owners o ON o.id = a.owner_id
    JOIN pets p ON p.id = a.pet_id
    JOIN message_templates mt ON mt.tenant_id = a.tenant_id AND mt.type = 'reminder'
    JOIN bot_config bc ON bc.tenant_id = a.tenant_id
    WHERE a.status = 'scheduled'
      AND a.reminder_sent = false
      AND mt.is_active = true
      AND bc.is_enabled = true
      AND a.scheduled_at BETWEEN (NOW() + INTERVAL '23 hours') AND (NOW() + INTERVAL '25 hours')
  ),
  inserted_msgs AS (
    INSERT INTO wa_messages (tenant_id, owner_id, pet_id, appt_id, type, phone, body)
    SELECT tenant_id, owner_id, pet_id, appt_id, 'reminder', phone, final_body
    FROM reminders
  )
  INSERT INTO whatsapp_chat_sessions (tenant_id, phone, owner_id, state, selected_service, last_message_at, expires_at)
  SELECT 
    tenant_id, 
    phone, 
    owner_id, 
    'esperando_confirmacion', 
    appt_id::text, 
    NOW(), 
    NOW() + INTERVAL '24 hours'
  FROM reminders;

  -- B. Recordatorios normales sin opciones (Para negocios con bot desactivado)
  INSERT INTO wa_messages (tenant_id, owner_id, pet_id, appt_id, type, phone, body)
  SELECT
    a.tenant_id,
    a.owner_id,
    a.pet_id,
    a.id,
    'reminder',
    o.whatsapp,
    replace(
      replace(
        replace(mt.body, '{owner_name}', o.name),
        '{pet_name}', p.name
      ),
      '{time}', to_char(a.scheduled_at at time zone 'America/Mexico_City', 'HH12:MI AM')
    )
  FROM appointments a
  JOIN owners o ON o.id = a.owner_id
  JOIN pets p ON p.id = a.pet_id
  JOIN message_templates mt ON mt.tenant_id = a.tenant_id AND mt.type = 'reminder'
  LEFT JOIN bot_config bc ON bc.tenant_id = a.tenant_id
  WHERE a.status = 'scheduled'
    AND a.reminder_sent = false
    AND mt.is_active = true
    AND (bc.is_enabled = false OR bc.is_enabled IS NULL)
    AND a.scheduled_at BETWEEN (NOW() + INTERVAL '23 hours') AND (NOW() + INTERVAL '25 hours');

  -- C. Marcar como enviados todos los que cayeron en la ventana
  UPDATE appointments
  SET reminder_sent = true
  WHERE status = 'scheduled'
    AND reminder_sent = false
    AND scheduled_at BETWEEN (NOW() + INTERVAL '23 hours') AND (NOW() + INTERVAL '25 hours');
  $$
);
