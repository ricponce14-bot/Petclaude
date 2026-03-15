"use client";
// app/(dashboard)/membresia/MembresiaClient.tsx
import { useState } from "react";
import { CreditCard, Check, Sparkles, Zap, ShieldCheck, Heart, ArrowRight, Loader2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

interface Props {
    tenant: {
        id: string;
        plan: string;
        trial_ends_at: string | null;
        created_at: string;
    } | null;
    userEmail: string;
    userId: string;
}

export default function MembresiaClient({ tenant, userEmail, userId }: Props) {
    const [processing, setProcessing] = useState(false);

    const plan = tenant?.plan ?? "trial";

    // Calcular días restantes del trial
    const trialEndsAt = tenant?.trial_ends_at ? parseISO(tenant.trial_ends_at) : null;
    const daysLeft = trialEndsAt ? Math.max(0, differenceInDays(trialEndsAt, new Date())) : 0;
    const trialExpired = plan === "trial" && daysLeft === 0;

    const handleUpgrade = async (planKey: string) => {
        setProcessing(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userEmail, id: userId, plan: planKey })
            });
            const { url, error } = await res.json();
            if (url) window.location.href = url;
            else alert(error || "Error al iniciar el pago");
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    // ── Plan status banner ────────────────────────────────────────
    const renderStatusBanner = () => {
        if (plan === "active") {
            return (
                <div className="bg-mint/10 border border-mint/20 rounded-xl px-5 py-4 flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-mint shrink-0" />
                    <div>
                        <p className="font-bold text-ink text-sm">Plan activo</p>
                        <p className="text-slate-500 text-xs mt-0.5">Tu suscripción está al corriente. Todas las funciones disponibles.</p>
                    </div>
                </div>
            );
        }

        if (plan === "past_due") {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3">
                    <AlertTriangle size={20} className="text-red-500 shrink-0" />
                    <div>
                        <p className="font-bold text-red-700 text-sm">Pago pendiente</p>
                        <p className="text-red-500 text-xs mt-0.5">Hubo un problema con tu último pago. Actualiza tu método de pago para continuar.</p>
                    </div>
                </div>
            );
        }

        if (plan === "cancelled") {
            return (
                <div className="bg-slate-100 border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-3">
                    <AlertTriangle size={20} className="text-slate-500 shrink-0" />
                    <div>
                        <p className="font-bold text-slate-700 text-sm">Suscripción cancelada</p>
                        <p className="text-slate-500 text-xs mt-0.5">Tu plan fue cancelado. Reactiva para seguir usando Ladrido.</p>
                    </div>
                </div>
            );
        }

        // trial
        if (trialExpired) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3">
                    <AlertTriangle size={20} className="text-red-500 shrink-0" />
                    <div>
                        <p className="font-bold text-red-700 text-sm">Prueba gratuita expirada</p>
                        <p className="text-red-500 text-xs mt-0.5">Tu período de prueba ha terminado. Suscríbete para continuar.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-sand/10 border border-sand/30 rounded-xl px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Clock size={20} className="text-sand-dark shrink-0" />
                    <div>
                        <p className="font-bold text-ink text-sm">Período de prueba gratuita</p>
                        <p className="text-slate-500 text-xs mt-0.5">Acceso completo a todas las funciones.</p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-2xl font-black text-sand-dark leading-none">{daysLeft}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">días restantes</p>
                </div>
            </div>
        );
    };

    const isSubscribed = plan === "active";

    return (
        <div className="px-4 py-5 md:px-6 md:py-6 max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-ink tracking-tight">Membresía</h1>
                <p className="text-slate-500 text-sm mt-1">Gestiona tu suscripción a Ladrido</p>
            </div>

            {/* Status */}
            {renderStatusBanner()}

            {/* Planes — solo mostrar si no está activo */}
            {!isSubscribed && (
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Mensual */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 flex flex-col">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4">
                            <Zap size={20} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-black text-ink mb-1">Mensual</h3>
                        <p className="text-slate-400 text-xs font-medium mb-5">Sin compromisos a largo plazo.</p>
                        <div className="flex items-baseline gap-1 mb-5">
                            <span className="text-4xl font-black text-ink">$199</span>
                            <span className="text-slate-400 font-bold text-sm">MXN/mes</span>
                        </div>
                        <ul className="space-y-2.5 mb-6 flex-1">
                            {["WhatsApps ilimitados", "Recordatorios automáticos", "Agenda y clientes", "Soporte estándar"].map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                    <Check size={14} className="text-mint shrink-0" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleUpgrade("monthly")}
                            disabled={processing}
                            className="btn-secondary w-full justify-center py-3 disabled:opacity-50"
                        >
                            {processing ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                            Suscribirme mensual
                        </button>
                    </div>

                    {/* Anual */}
                    <div className="bg-mint rounded-xl border border-mint/20 shadow-[0_4px_24px_rgba(77,161,138,0.2)] p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute top-3 right-3 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Heart size={10} className="fill-white" /> Recomendado
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-1">Anual</h3>
                        <p className="text-white/70 text-xs font-medium mb-5">Ahorra $789 MXN al año (4 meses gratis).</p>
                        <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-4xl font-black text-white">$1,599</span>
                            <span className="text-white/70 font-bold text-sm">MXN/año</span>
                        </div>
                        <p className="text-white/60 text-xs font-bold mb-5">$133/mes aprox.</p>
                        <ul className="space-y-2.5 mb-6 flex-1">
                            {["Todo lo del plan mensual", "Soporte prioritario VIP", "Acceso previo a funciones", "Consultoría mensual gratis"].map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm text-white font-medium">
                                    <Check size={14} className="text-white shrink-0" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleUpgrade("annual")}
                            disabled={processing}
                            className="bg-white text-mint font-bold py-3 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-white/90 transition-colors disabled:opacity-50 text-sm"
                        >
                            {processing ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                            Suscribirme anual
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                {[
                    { icon: ShieldCheck, color: "text-mint bg-mint/10", title: "Pago seguro", desc: "Procesado por Stripe" },
                    { icon: CreditCard, color: "text-sand-dark bg-sand/10", title: "Sin comisiones", desc: "Sin cargos ocultos" },
                    { icon: Heart, color: "text-red-400 bg-red-50", title: "Cancela cuando quieras", desc: "Sin permanencia" },
                ].map(({ icon: Icon, color, title, desc }) => (
                    <div key={title} className="flex flex-col items-center text-center gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                            <Icon size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-ink">{title}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
