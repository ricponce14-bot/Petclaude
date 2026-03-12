import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    const stripe = getStripe();
    const supabase = getSupabaseAdmin();

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
                            .returns<any>()
                            .single();

                        if (tenant) {
                            await supabase
                                .from("tenants")
                                .update({
                                    stripe_customer_id: customerId,
                                    stripe_subscription_id: session.subscription as string,
                                    plan: "active"
                                } as any)
                                .eq("id", (tenant as any).id);

                            console.log(`✅ Tenant ${(tenant as any).id} activado con Stripe Customer ${customerId}`);
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
                                } as any)
                                .select("id")
                                .returns<any>()
                                .single();

                            if (newTenant && userId) {
                                // Actualizar app_metadata del usuario con el tenant_id
                                await supabase.auth.admin.updateUserById(userId, {
                                    app_metadata: { tenant_id: (newTenant as any).id }
                                });
                                console.log(`✅ Nuevo tenant ${(newTenant as any).id} creado y vinculado a usuario ${userId}`);
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
                let planStatus = "active";

                if (["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)) {
                    planStatus = "cancelled";
                } else if (subscription.status === "past_due") {
                    planStatus = "past_due";
                } else if (subscription.status === "trialing") {
                    planStatus = "trial";
                }

                const { error } = await supabase
                    .from("tenants")
                    .update({ plan: planStatus } as any)
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
                        .update({ plan: "active" } as any)
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
                        .update({ plan: "past_due" } as any)
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
