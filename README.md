# 🐾 Ladrido — Setup Guide

## Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + Edge Functions)
- **WhatsApp**: Evolution API en VPS Hetzner

---

## 1. Supabase

```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar proyecto (si usas local dev)
supabase init
supabase start
```

1. Crea un proyecto en https://supabase.com
2. Ve a **SQL Editor** y ejecuta en orden:
   - `supabase/schema.sql`
   - `supabase/cron_jobs.sql`
3. En **Authentication → Providers**: activa Email/Password
4. En **Project Settings → API**: copia `URL` y `anon key`

### Deploy Edge Functions

```bash
supabase functions deploy wa-dispatcher --no-verify-jwt
supabase functions deploy wa-webhook --no-verify-jwt

# Agregar secrets
supabase secrets set EVOLUTION_API_URL=http://TU_IP:8080
supabase secrets set EVOLUTION_API_KEY=tu_key
```

### Programar el dispatcher (cada minuto)

En el SQL Editor:
```sql
select cron.schedule(
  'wa-dispatcher',
  '* * * * *',
  $$ select net.http_post(
    url := 'https://TU_PROYECTO.supabase.co/functions/v1/wa-dispatcher',
    headers := '{"Authorization": "Bearer TU_ANON_KEY"}'::jsonb
  ) $$
);
```

---

## 2. Evolution API en Hetzner

```bash
# En tu VPS Hetzner (Ubuntu 22.04 ARM)
git clone https://github.com/EvolutionAPI/evolution-api
cd evolution-api
cp .env.example .env
# Editar .env: PORT=8080, API_KEY=tu_key_segura, etc.

docker compose up -d
```

---

## 3. Next.js (local)

```bash
npm install
cp .env.local.example .env.local
# Llenar variables en .env.local

npm run dev
# Abre http://localhost:3000
```

---

## 4. Deploy en Vercel

```bash
npm install -g vercel
vercel
# Agregar las variables de entorno en el dashboard de Vercel
```

---

## Estructura del proyecto

```
petcloud/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx         # Layout con Sidebar (requiere auth)
│   │   ├── dashboard/         # Home con stats del día
│   │   ├── agenda/            # Calendario de citas
│   │   ├── clientes/          # CRM de dueños
│   │   ├── mascotas/[id]/     # Perfil + historial clínico
│   │   └── whatsapp/          # Conexión QR de Evolution API
│   ├── api/
│   │   └── whatsapp/
│   │       └── create-instance/ # POST: crea instancia en Evolution
│   └── login/
├── components/
│   ├── layout/Sidebar.tsx
│   ├── agenda/
│   │   ├── AppointmentCard.tsx
│   │   └── NewAppointmentModal.tsx
│   └── crm/
│       └── NewOwnerModal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server Component client
│   │   └── types.ts           # TypeScript types
│   └── utils.ts
└── supabase/
    ├── schema.sql              # Tablas, RLS, funciones
    ├── cron_jobs.sql           # pg_cron automatizaciones
    └── functions/
        ├── wa-dispatcher/      # Cola de mensajes WhatsApp
        └── wa-webhook/         # Eventos de Evolution API
```

---

## Flujo de automatizaciones

```
pg_cron (cada hora) → inserta en wa_messages (status=pending)
pg_cron (cada minuto) → dispara Edge Function wa-dispatcher
wa-dispatcher → lee pending + wa_sessions(status=connected) → envía via Evolution API → actualiza status
Evolution API → webhook → wa-webhook Edge Function → actualiza DB (confirmaciones, QR, conexión)
```
