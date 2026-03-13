import { NextResponse } from "next/server";
import Stripe from "stripe";

// Eliminamos la inicialización fuera del handler

export async function POST(req: Request) {
    const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();

    if (!stripeSecret || stripeSecret.includes("placeholder")) {
        return NextResponse.json({ 
            error: "Configuración de Stripe incompleta", 
            details: "La clave secreta (STRIPE_SECRET_KEY) no está configurada o es inválida en Vercel." 
        }, { status: 500 });
    }

    // Inicializamos Stripe dentro del handler para asegurar que tome las variables de entorno de Vercel runtime
    const stripe = new Stripe(stripeSecret, {
        apiVersion: "2024-06-20" as any, // Forzamos una versión estable
    });

    try {
        const { email, id, plan } = await req.json();

        if (!email || !id) {
            return NextResponse.json({ error: "Email o ID no proporcionado" }, { status: 400 });
        }

        const priceId = plan === "annual"
            ? process.env.STRIPE_PRICE_ID_ANNUAL
            : process.env.STRIPE_PRICE_ID_MONTHLY;

        const customer = await stripe.customers.create({
            email,
            metadata: { supabase_user_id: id },
        });

        // 2. Creamos la sesión de Checkout con 7 días de prueba
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            subscription_data: {
                trial_period_days: 7, // 7 Días gratis antes de cobrar
            },
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/registro`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error("Error creating stripe checkout:", err);
        return NextResponse.json({ 
            error: "Error en la pasarela de pago",
            details: err.message 
        }, { status: 500 });
    }
}
