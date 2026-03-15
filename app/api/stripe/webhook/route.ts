import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Eliminamos la inicialización fuera del handler para asegurar que tome las variables en runtime

export async function POST(req: Request) {
    const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecret) {
        console.error("❌ Stripe webhook error: Falta STRIPE_SECRET_KEY");
        return new NextResponse("Stripe secret key missing", { status: 500 });
    }

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    const stripe = new Stripe(stripeSecret, {
        apiVersion: "2024-06-20" as any,
    });
    const supabase = getSupabaseAdmin() as any;

    try {
        if (!sig || !endpointSecret) {
            console.warn("⚠️ Stripe webhook: no signature/secret — modo test");
            event = JSON.parse(body) as Stripe.Event;
        } else {
            event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
        }
    } catch (err: any) {
        console.error(`❌ Webhook signature error: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`📩 Stripe event: ${event.type}`);

    try {
        switch (event.type) {
            // ── Checkout completado (primer pago / suscripción creada) ──
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const customerId = session.customer as string;

                if (customerId) {
                    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                    const userId = customer.metadata?.supabase_user_id;
                    const email = customer.email;

                    // Buscar tenant por email
                    if (email) {
                        const { data: tenant } = await supabase
                            .from("tenants")
                            .select("id")
                            .eq("email", email)
                            .single();

                        if (tenant) {
                            await supabase
                                .from("tenants")
                                .update({
                                    stripe_customer_id: customerId,
                                    stripe_subscription_id: session.subscription as string,
                                    plan: "active"
                                })
                                .eq("id", tenant.id);

                            console.log(`✅ Tenant ${tenant.id} activado con Stripe Customer ${customerId}`);
                        } else {
                            // Crear tenant nuevo si vino desde registro + pago
                            const { data: newTenant } = await supabase
                                .from("tenants")
                                .insert({
                                    name: email.split("@")[0],
                                    email,
                                    plan: "active",
                                    stripe_customer_id: customerId,
                                    stripe_subscription_id: session.subscription as string,
                                })
                                .select("id")
                                .single();

                            if (newTenant && userId) {
                                await supabase.auth.admin.updateUserById(userId, {
                                    app_metadata: { tenant_id: newTenant.id }
                                });
                                console.log(`✅ Nuevo tenant ${newTenant.id} creado y vinculado a usuario ${userId}`);
                            }
                        }
                    }
                }
                break;
            }

            // ── Suscripción actualizada/cancelada ──
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const statusMap: Record<string, string> = {
                    "active":             "active",
                    "trialing":           "trial",
                    "past_due":           "past_due",
                    "canceled":           "cancelled",
                    "unpaid":             "cancelled",
                    "incomplete_expired": "cancelled",
                    "incomplete":         "past_due",
                    "paused":             "cancelled",
                };
                const planStatus = statusMap[subscription.status] ?? "active";

                const { error } = await supabase
                    .from("tenants")
                    .update({ plan: planStatus })
                    .eq("stripe_subscription_id", subscription.id);

                if (error) {
                    console.error("❌ Error updating subscription status:", error.message);
                } else {
                    console.log(`✅ Suscripción ${subscription.id} → ${planStatus}`);
                }
                break;
            }

            // ── Factura pagada (reactivar plan) ──
            case "invoice.paid": {
                const invoice = event.data.object as any;
                if (invoice.subscription) {
                    await supabase
                        .from("tenants")
                        .update({ plan: "active" })
                        .eq("stripe_subscription_id", invoice.subscription as string);
                    console.log(`✅ Invoice pagada, plan reactivado para sub ${invoice.subscription}`);
                }
                break;
            }

            // ── Factura fallida ──
            case "invoice.payment_failed": {
                const invoice = event.data.object as any;
                if (invoice.subscription) {
                    await supabase
                        .from("tenants")
                        .update({ plan: "past_due" })
                        .eq("stripe_subscription_id", invoice.subscription as string);
                    console.log(`⚠️ Invoice fallida, plan en past_due para sub ${invoice.subscription}`);
                }
                break;
            }

            default:
                console.log(`ℹ️ Evento no manejado: ${event.type}`);
        }
    } catch (err: any) {
        console.error("❌ Error procesando webhook:", err);
        return new NextResponse("Error updating DB", { status: 500 });
    }

    return NextResponse.json({ received: true });
}
