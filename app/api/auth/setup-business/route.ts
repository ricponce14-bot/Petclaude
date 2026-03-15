import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        const {
            userId,
            businessName,
            city,
            businessPhone,
            services,
            businessHours,
            slotDuration,
        } = await req.json();

        if (!userId || !businessName) {
            return NextResponse.json({ error: "userId y businessName son requeridos" }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Obtener el tenant_id del usuario via auth metadata
        const { data: { user }, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userErr || !user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id;
        if (!tenantId) {
            return NextResponse.json({ error: "tenant_id no encontrado en el usuario" }, { status: 400 });
        }

        // 2. Actualizar el tenant con los datos del negocio
        const { error: tenantErr } = await supabaseAdmin
            .from("tenants")
            .update({
                name: businessName,
                city: city || null,
                phone: businessPhone || null,
            } as any)
            .eq("id", tenantId);

        if (tenantErr) {
            console.error("[setup-business] Error actualizando tenant:", tenantErr.message);
            // No fallar aquí, continuar con bot_config
        }

        // 3. Crear bot_config inicial (upsert por si ya existe)
        const defaultWelcome =
            `¡Hola! 👋 Bienvenido a *${businessName}*.\n\n` +
            `¿En qué puedo ayudarte?\n\n` +
            `1️⃣ Agendar una cita\n` +
            `2️⃣ Ver precios y servicios\n` +
            `3️⃣ Hablar con un asesor\n` +
            `4️⃣ Reagendar cita`;

        const defaultConfirmation =
            `✅ ¡Cita confirmada!\n\n` +
            `🐕 Servicio: *{servicio}*\n` +
            `📅 Fecha: *{fecha}*\n` +
            `🕐 Hora: *{hora}*\n\n` +
            `Te esperamos en *${businessName}*. ¡Hasta pronto! 🐾`;

        const { error: botErr } = await supabaseAdmin
            .from("bot_config")
            .upsert({
                tenant_id: tenantId,
                is_enabled: true,
                welcome_message: defaultWelcome,
                confirmation_template: defaultConfirmation,
                services: services?.length ? services : [
                    { key: "bath",         label: "Baño",        price: 250, duration_min: 60 },
                    { key: "bath_haircut", label: "Baño + Corte", price: 400, duration_min: 90 },
                ],
                business_hours: businessHours || {
                    lun: { open: "09:00", close: "18:00" },
                    mar: { open: "09:00", close: "18:00" },
                    mie: { open: "09:00", close: "18:00" },
                    jue: { open: "09:00", close: "18:00" },
                    vie: { open: "09:00", close: "18:00" },
                    sab: { open: "09:00", close: "15:00" },
                },
                slot_duration_min: slotDuration || 60,
            } as any, {
                onConflict: "tenant_id",
            });

        if (botErr) {
            console.error("[setup-business] Error creando bot_config:", botErr.message);
            // No fallar — el bot_config se puede configurar después desde el dashboard
        }

        return NextResponse.json({ ok: true });

    } catch (err: any) {
        console.error("[setup-business] Error inesperado:", err);
        return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
    }
}
