// app/api/whatsapp/create-instance/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let tenantId = session.user.user_metadata?.tenant_id;

  // Auto-provisión de Tenant para cuentas creadas manualmente en Supabase
  if (!tenantId) {
    const { data: existingTenants } = await supabase.from("tenants").select("id").limit(1);
    if (existingTenants && existingTenants.length > 0) {
      tenantId = (existingTenants[0] as any).id;
    } else {
      const { data: newTenant, error: tErr } = await supabase.from("tenants").insert({ name: "Ladrido Default", plan: "pro" } as any).select().single();
      if (tErr) return NextResponse.json({ error: "Fallo al crear Tenant: " + tErr.message }, { status: 500 });
      tenantId = (newTenant as any).id;
    }
    await supabase.auth.updateUser({ data: { tenant_id: tenantId } });
  }

  const instance = `ladrido_${tenantId.replace(/-/g, "").slice(0, 8)}`;
  const apiUrl = process.env.EVOLUTION_API_URL!;
  const apiKey = process.env.EVOLUTION_API_KEY!;
  const headers = { "Content-Type": "application/json", apikey: apiKey };

  try {
    // 1. Borrar instancia anterior si existe (evitar duplicados)
    try {
      await fetch(`${apiUrl}/instance/delete/${instance}`, {
        method: "DELETE",
        headers: { apikey: apiKey },
      });
    } catch (e) { /* OK si no existe */ }

    // Pausa para que Evolution API procese la eliminación
    await new Promise(r => setTimeout(r, 2000));

    // 2. Crear instancia limpia
    const createRes = await fetch(`${apiUrl}/instance/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        instanceName: instance,
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    // 3. Esperar a que Baileys inicialice (crucial - NO bombardear con connects)
    await new Promise(r => setTimeout(r, 5000));

    // 4. Llamar connect UNA SOLA VEZ para gatillar la generación del QR
    const connectRes = await fetch(`${apiUrl}/instance/connect/${instance}`, {
      method: "GET",
      headers: { apikey: apiKey },
    });

    let qrCode = null;
    if (connectRes.ok) {
      const connectData = await connectRes.json();
      qrCode = connectData?.base64 || connectData?.qrcode?.base64 || null;
    }

    // 5. Si no llegó el QR inmediatamente, esperar 5s más y consultar SIN reconectar
    if (!qrCode) {
      await new Promise(r => setTimeout(r, 5000));

      const connectRes2 = await fetch(`${apiUrl}/instance/connect/${instance}`, {
        method: "GET",
        headers: { apikey: apiKey },
      });

      if (connectRes2.ok) {
        const data2 = await connectRes2.json();
        qrCode = data2?.base64 || data2?.qrcode?.base64 || null;
      }
    }

    // 6. Configurar webhook para recepción de mensajes del bot
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
    if (appUrl) {
      try {
        await fetch(`${apiUrl}/webhook/set/${instance}`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            url: `${appUrl}/api/whatsapp/webhook`,
            webhook_by_events: true,
            events: ["MESSAGES_UPSERT"],
            enabled: true
          })
        });
        console.log(`[WhatsApp] Webhook configurado para ${instance}`);
      } catch (e) {
        console.warn("[WhatsApp] No se pudo configurar webhook:", e);
        // No fallar si el webhook no se configura — es una funcionalidad extra
      }
    }

    // 7. Guardar en Supabase
    await supabase.from("wa_sessions").upsert({
      tenant_id: tenantId,
      instance,
      status: "qr_needed",
      qr_code: qrCode,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "tenant_id" });

    // 8. Crear configuración por defecto del bot si no existe
    const { data: existingBotConfig } = await supabase
      .from("bot_config")
      .select("id")
      .eq("tenant_id", tenantId)
      .single();

    if (!existingBotConfig) {
      await supabase.from("bot_config").insert({
        tenant_id: tenantId,
        is_enabled: true,
      } as any);
    }

    return NextResponse.json({ ok: true, instance, qr_code: qrCode });
  } catch (err: any) {
    return NextResponse.json({ error: "Fallo al contactar Evolution API en Hetzner: " + err.message }, { status: 500 });
  }
}

