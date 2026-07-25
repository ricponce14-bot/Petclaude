// app/api/cron/daily-summary/route.ts
// Resumen diario 8am al dueño (doc sección 9): cuenta las citas del día por
// negocio y manda la plantilla resumen_diario a cada dueño registrado.
// Programar con Vercel Cron a las 14:00 UTC (= 8am CST, México sin DST).
// Protegido con CRON_SECRET.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendResumenDiario } from "@/lib/whatsapp/templates";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // en prod siempre debe existir
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

async function run(): Promise<{ sent: number; skipped: number }> {
  const db = getSupabaseAdmin() as any;

  // Negocios con WhatsApp vinculado.
  const { data: tenants } = await db
    .from("tenants")
    .select("id, name")
    .eq("whatsapp_vinculado", true);

  let sent = 0;
  let skipped = 0;
  if (!tenants || tenants.length === 0) return { sent, skipped };

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  for (const t of tenants) {
    // Contar citas de hoy.
    const { count } = await db
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", t.id)
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_at", start)
      .lte("scheduled_at", end);

    // Dueños del negocio.
    const { data: duenos } = await db
      .from("phone_registry")
      .select("telefono")
      .eq("tenant_id", t.id)
      .eq("rol", "dueño");

    if (!duenos || duenos.length === 0) {
      skipped++;
      continue;
    }

    for (const d of duenos) {
      const res = await sendResumenDiario(d.telefono, {
        negocio: t.name ?? "tu negocio",
        totalCitas: String(count ?? 0),
      });
      if (res.ok) sent++;
      else skipped++;
    }
  }

  return { sent, skipped };
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await run()) });
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await run()) });
}
