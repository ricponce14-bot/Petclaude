// app/api/whatsapp/send-message/route.ts
// Envío manual de un mensaje desde el dashboard, vía WhatsApp Cloud API.
// NOTA: solo funciona DENTRO de la ventana de 24h (el cliente escribió primero).
// Fuera de la ventana hay que usar una plantilla aprobada (ver lib/whatsapp/templates.ts).

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendText } from "@/lib/whatsapp/cloud-client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { owner_id, pet_id, phone: manualPhone, body } = await req.json();
    const tenantId = session.user.app_metadata?.tenant_id || session.user.user_metadata?.tenant_id;

    if (!tenantId) return NextResponse.json({ error: "No se encontró tu negocio" }, { status: 400 });
    if ((!owner_id && !manualPhone) || !body) {
      return NextResponse.json({ error: "Cliente y mensaje son requeridos" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    let finalPhone = manualPhone;

    if (owner_id) {
      const { data: owner, error: ownerErr } = await supabaseAdmin
        .from("owners")
        .select("*")
        .eq("id", owner_id)
        .single();
      if (ownerErr) {
        return NextResponse.json({ error: "Error buscando cliente: " + ownerErr.message }, { status: 500 });
      }
      finalPhone =
        (owner as any)?.whatsapp || (owner as any)?.phone || (owner as any)?.telefono || manualPhone || null;
    }

    if (!finalPhone) {
      return NextResponse.json({ error: "No se encontró un número de teléfono válido." }, { status: 400 });
    }
    finalPhone = finalPhone.replace(/\D/g, "");

    // Enviar por Cloud API.
    const result = await sendText(finalPhone, body);

    // Loguear en wa_messages para tracking.
    await (supabaseAdmin as any).from("wa_messages").insert({
      tenant_id: tenantId,
      owner_id: owner_id || null,
      pet_id: pet_id || null,
      type: "manual",
      phone: finalPhone,
      body,
      direction: "outbound",
      status: result.ok ? "sent" : "failed",
      sent_at: new Date().toISOString(),
      error: result.ok ? null : result.error,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "No se pudo enviar (¿ventana de 24h cerrada?)" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
