-- supabase/06_dynamic_cron_jobs.sql
-- Ejecutar en Supabase SQL Editor

-- ==========================================
-- 1. Actualizar Recordatorios (24h antes)
-- ==========================================
select cron.schedule(
  'reminder-24h',
  '0 * * * *',   -- cada hora en punto
  $$
  insert into wa_messages (tenant_id, owner_id, pet_id, appt_id, type, phone, body)
  select
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
  from appointments a
  join owners o on o.id = a.owner_id
  join pets   p on p.id = a.pet_id
  join message_templates mt on mt.tenant_id = a.tenant_id and mt.type = 'reminder'
  where a.status = 'scheduled'
    and a.reminder_sent = false
    and mt.is_active = true
    and a.scheduled_at between (now() + interval '23 hours') and (now() + interval '25 hours');

  update appointments
  set reminder_sent = true
  where status = 'scheduled'
    and reminder_sent = false
    and scheduled_at between (now() + interval '23 hours') and (now() + interval '25 hours');
  $$
);

-- ==========================================
-- 2. Actualizar Win-back (30 días después)
-- ==========================================
select cron.schedule(
  'winback-30days',
  '0 16 * * *',  -- 16:00 UTC = 10:00 AM México
  $$
  insert into wa_messages (tenant_id, owner_id, pet_id, type, phone, body)
  select distinct on (p.id)
    p.tenant_id,
    p.owner_id,
    p.id,
    'winback',
    o.whatsapp,
    replace(
      replace(mt.body, '{owner_name}', o.name),
      '{pet_name}', p.name
    )
  from pets p
  join owners o on o.id = p.owner_id
  join message_templates mt on mt.tenant_id = p.tenant_id and mt.type = 'winback'
  where last_visit(p.id) < now() - interval '30 days'
    and last_visit(p.id) > now() - interval '32 days'
    and mt.is_active = true
    and not exists (
      select 1 from wa_messages wm
      where wm.pet_id = p.id
        and wm.type = 'winback'
        and wm.created_at > now() - interval '30 days'
    );
  $$
);

-- ==========================================
-- 3. Actualizar Cumpleaños
-- ==========================================
select cron.schedule(
  'birthday-greetings',
  '0 15 * * *',  -- 15:00 UTC = 9:00 AM México
  $$
  insert into wa_messages (tenant_id, owner_id, pet_id, type, phone, body)
  select
    p.tenant_id,
    p.owner_id,
    p.id,
    'birthday',
    o.whatsapp,
    replace(
      replace(mt.body, '{owner_name}', o.name),
      '{pet_name}', p.name
    )
  from pets p
  join owners o on o.id = p.owner_id
  join message_templates mt on mt.tenant_id = p.tenant_id and mt.type = 'birthday'
  where extract(month from p.birthdate) = extract(month from now())
    and extract(day   from p.birthdate) = extract(day   from now())
    and mt.is_active = true
    and not exists (
      select 1 from wa_messages wm
      where wm.pet_id = p.id
        and wm.type = 'birthday'
        and date_trunc('day', wm.created_at) = date_trunc('day', now())
    );
  $$
);

/* 
-- Opcional: Ejecutor de Cola (Webhook HTTP - Requiere extensión pg_net)
-- Esto invoca nuestro worker en /api/whatsapp/process-queue automáticamente
select cron.unschedule('process-whatsapp-queue');
select cron.schedule(
  'process-whatsapp-queue',
  '* * * * *', -- Cada minuto
  'select net.http_post(
     url := ''https://TU-DOMINIO-AQUI.com/api/whatsapp/process-queue'',
     headers := ''{"Content-Type": "application/json"}'',
     body := ''{}''
  )'
);
*/
