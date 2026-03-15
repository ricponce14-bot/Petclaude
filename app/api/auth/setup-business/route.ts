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

        // 1. Obtener el usuario
        const { data: { user }, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userErr || !user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        let tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id;

        if (!tenantId) {
            // Usuario nuevo — crear el tenant aquí mismo (no esperar al webhook de Stripe)
            const { data: newTenant, error: createErr } = await supabaseAdmin
                .from("tenants")
                .insert({
                    name: businessName,
                    email: user.email,
                    city: city || null,
                    phone: businessPhone || null,
                    plan: "trial",
                } as any)
                .select("id")
                .single();

            if (createErr || !newTenant) {
                console.error("[setup-business] Error creando tenant:", createErr?.message);
                return NextResponse.json({ error: "Error al crear el negocio" }, { status: 500 });
            }

            tenantId = (newTenant as any).id;

            // Vincular el tenant_id al usuario en app_metadata para que RLS funcione
            const { error: metaErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                app_metadata: { tenant_id: tenantId },
            });
            if (metaErr) {
                console.error("[setup-business] Error vinculando tenant al usuario:", metaErr.message);
            }

            console.log(`✅ Nuevo tenant ${tenantId} creado y vinculado a usuario ${userId}`);
        } else {
            // Usuario existente — actualizar datos del negocio
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
            }
        }

        // 2. Crear bot_config inicial (upsert por si ya existe)
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
            // No fallar — se puede configurar después desde el dashboard
        }

        return NextResponse.json({ ok: true });

    } catch (err: any) {
        console.error("[setup-business] Error inesperado:", err);
        return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
    }
}
