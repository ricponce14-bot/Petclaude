# 🐾 Apúntame.mx — Guía de setup

Plataforma SaaS multi-tenant de agendamiento de citas por WhatsApp. Cada negocio
(estética, barbería, spa, clínica…) es un *tenant*. El asistente conversacional
se llama **Mía** y atiende dos audiencias en el mismo número:

- **Clientes finales** → agendan citas conversando con el bot.
- **Dueños** → administran el negocio en lenguaje natural (texto o audio): agendar
  a nombre de un cliente, consultar disponibilidad, registrar gastos, ver la
  agenda del día, etc.

## Stack
- **Frontend/Backend**: Next.js 14 (App Router) + Tailwind — Vercel Pro
- **Base de datos**: Supabase (PostgreSQL + Auth)
- **WhatsApp**: WhatsApp Business Platform oficial (**Cloud API de Meta**),
  un solo número centralizado (una WABA) para toda la plataforma.
- **IA**: Claude Haiku 4.5 (function calling de Mía, default) + Sonnet (fallback),
  con prompt caching. Whisper para transcripción de audio.

> ⚠️ **NO** se usa Evolution API / Baileys / WPPConnect ni ningún API no oficial
> de WhatsApp. Ver `docs/Apuntame_Project_Context.docx` (fuente de verdad de
> arquitectura) — léelo completo antes de proponer cambios.

---

## 1. Supabase

El repo está pensado para la **integración GitHub → Supabase**: al hacer push,
Supabase aplica las migraciones de `supabase/migrations/` en orden. Todas son
**idempotentes** (seguras sobre la base existente y capaces de reconstruir un
proyecto vacío):

1. `20260101000000_baseline_schema.sql` — esquema base completo (incluye
   `bot_config`, `whatsapp_chat_sessions` y `wa_messages.media_url`, que antes
   solo existían en la BD)
2. `20260724100001_phase1_apuntame.sql` — `phone_registry`, `activation_tokens`, `expenses`, columnas de `tenants`
3. `20260724100002_phase3_queue.sql` — cola de eventos entrantes (`wa_inbound_queue`)
4. `20260724100003_phase5_appointments_generic.sql` — citas genéricas multi-sector

También puedes aplicarlas a mano en **SQL Editor**, en ese orden. Además:
- **Authentication → Providers**: activa Email/Password
- **Project Settings → API**: copia `URL` y `anon key`
- Usa el **connection pooler** (PgBouncer) en funciones serverless

---

## 2. WhatsApp Cloud API (Meta)

1. Da de alta un negocio y una WABA en Meta; el **display name** del número debe
   ser **"Apúntame"** (Meta exige una sola marca verificable).
2. Obtén `WHATSAPP_TOKEN` (System User), `WHATSAPP_PHONE_NUMBER_ID` y define un
   `WHATSAPP_VERIFY_TOKEN`.
3. Configura el webhook apuntando a `https://TU_DOMINIO/api/whatsapp/webhook`
   con el mismo verify token; suscríbete a `messages`.
4. Crea las plantillas *utility* (genéricas, con variables): `confirmacion_cita`,
   `recordatorio_cita`, `cancelacion_cita`, `reagendado_cita`, `resumen_diario`.

---

## 3. Next.js (local)

```bash
npm install
cp .env.local.example .env.local
# Llenar variables en .env.local

npm run dev
# http://localhost:3000
```

---

## 4. Deploy en Vercel

```bash
vercel
# Configurar variables de entorno en el dashboard
# Activar Fluid Compute (flujos audio → STT → LLM pueden durar cientos de seg)
```

Los crons están en `vercel.json`:
- `/api/whatsapp/process-queue` (cada minuto) — worker de la cola entrante
- `/api/cron/reminders-24h`, `/api/cron/reminders-1h` — recordatorios
- `/api/cron/daily-summary` (14:00 UTC = 8am CST) — resumen diario al dueño

---

## Estructura relevante

```
lib/
├── whatsapp/
│   ├── cloud-client.ts   # Cliente Cloud API (send text/interactive/template, media, STT download)
│   ├── queue.ts          # Cola de eventos entrantes
│   ├── router.ts         # Enrutamiento por phone_registry (dueño → Mía, cliente → bot)
│   ├── onboarding.ts     # Activación del dueño + código público
│   ├── templates.ts      # Plantillas utility
│   └── stt.ts            # Transcripción de audio (Whisper)
├── mia/
│   ├── tools.ts          # Definiciones de function calling
│   ├── actions.ts        # Implementación contra Supabase
│   └── mia_intent_service.ts  # Loop de Claude (Haiku 4.5 + Sonnet fallback)
└── whatsapp-bot/         # Bot de agendamiento para clientes finales
app/api/whatsapp/
├── webhook/              # GET verificación Meta + POST encola y responde 200
├── process-queue/        # Worker asíncrono
├── send-message/         # Envío manual desde el dashboard (Cloud API)
└── activation-link/      # Genera link/QR de activación del dueño
```

## Flujo de mensajes entrantes

```
Meta webhook → /api/whatsapp/webhook  (parsear + encolar + 200 OK inmediato)
             → wa_inbound_queue
worker /api/whatsapp/process-queue:
  1. resolver rol/tenant por phone_registry (o código del wa.me si es nuevo)
  2. si es audio → transcribir (Whisper)
  3. dueño   → Mía (function calling)
     cliente → bot de agendamiento
  4. responder vía Cloud API
```
