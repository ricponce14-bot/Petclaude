// app/api/whatsapp/cleanup-sessions/route.ts
// Cron job para limpiar sesiones de chat expiradas

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // Proteger con CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const isCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("whatsapp_chat_sessions")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("id");

    const deleted = data?.length || 0;

    return NextResponse.json({
      ok: true,
      deleted,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[Cleanup] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
