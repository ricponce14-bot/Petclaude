import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

export async function POST(req: Request) {
    try {
        const { email, id, plan } = await req.json();

        if (!email || !id) {
            return NextResponse.json({ error: "Email o ID no proporcionado" }, { status: 400 });
        }

        const priceId = plan === "annual"
            ? process.env.STRIPE_PRICE_ID_ANNUAL
            : process.env.STRIPE_PRICE_ID_MONTHLY;

        // 1. Buscamos si ya existe el cliente en Stripe, si no lo creamos.
        // Usamos el ID del usuario como metadata para vincularlo fácilmente en el webhook
        const customer = await stripe.customers.create({
            email,
            metadata: { supbase_user_id: id },
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
        return NextResponse.json({ error: "Error en la pasarela de pago" }, { status: 500 });
    }
}
