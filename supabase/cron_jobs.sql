-- ============================================================
-- PetCloud — pg_cron Jobs (automatizaciones diarias)
-- Ejecutar después del schema.sql en Supabase Dashboard > SQL Editor
-- ============================================================

-- Job 1: Recordatorios de cita (cada hora, busca citas en 24h)
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
    format(
      '¡Hola %s! 🐾 Te recordamos que mañana a las %s es la cita de *%s*. ¡Te esperamos! Responde *CONFIRMAR* o *CANCELAR*.',
      o.name,
      to_char(a.scheduled_at at time zone 'America/Mexico_City', 'HH12:MI AM'),
      p.name
    )
  from appointments a
  join owners o on o.id = a.owner_id
  join pets   p on p.id = a.pet_id
  where a.status = 'scheduled'
    and a.reminder_sent = false
    and a.scheduled_at between (now() + interval '23 hours') and (now() + interval '25 hours');

  -- Marcar como enviados
  update appointments
  set reminder_sent = true
  where status = 'scheduled'
    and reminder_sent = false
    and scheduled_at between (now() + interval '23 hours') and (now() + interval '25 hours');
  $$
);

-- Job 2: Win-back (diario a las 10 AM Ciudad de México)
select cron.schedule(
  'winback-30days',
  '0 16 * * *',  -- 16:00 UTC = 10:00 AM México (UTC-6)
  $$
  insert into wa_messages (tenant_id, owner_id, pet_id, type, phone, body)
  select distinct on (p.id)
    p.tenant_id,
    p.owner_id,
    p.id,
    'winback',
    o.whatsapp,
    format(
      '¡Hola %s! 👋 Han pasado 30 días desde la última visita de *%s*. ¿Agendamos esta semana? Responde *CITA* y te ayudamos 🐶',
      o.name,
      p.name
    )
  from pets p
  join owners o on o.id = p.owner_id
  where last_visit(p.id) < now() - interval '30 days'
    and last_visit(p.id) > now() - interval '32 days'
    and not exists (
      select 1 from wa_messages wm
      where wm.pet_id = p.id
        and wm.type = 'winback'
        and wm.created_at > now() - interval '30 days'
    );
  $$
);

-- Job 3: Cumpleaños (diario a las 9 AM Ciudad de México)
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
    format(
      '🎂 ¡Feliz cumpleaños a *%s*! 🐾 Para celebrar, te ofrecemos *15%% de descuento* en su próximo baño esta semana. ¡Agenda ya respondiendo *CUMPLE*! 🎉',
      p.name
    )
  from pets p
  join owners o on o.id = p.owner_id
  where extract(month from p.birthdate) = extract(month from now())
    and extract(day   from p.birthdate) = extract(day   from now())
    and not exists (
      select 1 from wa_messages wm
      where wm.pet_id = p.id
        and wm.type = 'birthday'
        and date_trunc('day', wm.created_at) = date_trunc('day', now())
    );
  $$
);
