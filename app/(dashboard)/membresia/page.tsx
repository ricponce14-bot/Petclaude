"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, Check, Sparkles, Zap, ShieldCheck, Heart, ArrowRight, Loader2 } from "lucide-react";

export default function MembresiaPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [currentPlan, setCurrentPlan] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        async function getSession() {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user);
            // In a real app, we would fetch the subscription status from our DB/Stripe
            // For now, let's assume trial or monthly
            setCurrentPlan("trial");
            setLoading(false);
        }
        getSession();
    }, []);

    const handleUpgrade = async (plan: string) => {
        setProcessing(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, id: user.id, plan })
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

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-teal-500" size={40} />
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto pb-24 md:pb-6 space-y-10">
            <header className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Membresía y Facturación</h1>
                <p className="text-slate-500 font-semibold">Gestiona el crecimiento de tu clínica con Ladrido.</p>
            </header>

            {/* Current Plan Status Card */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-black uppercase tracking-widest">
                            <Sparkles size={14} /> Plan Actual
                        </div>
                        <h2 className="text-5xl font-black">Prueba Gratuita</h2>
                        <p className="text-slate-400 font-medium max-w-sm">
                            Tu prueba de 7 días está activa. Disfruta de todas las funciones premium sin restricciones.
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col items-center gap-2">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-tight">Días restantes</span>
                        <span className="text-6xl font-black text-teal-400">7</span>
                    </div>
                </div>
            </div>

            {/* Pricing Tiers */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Monthly Card */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-soft-teal hover:-translate-y-2 transition-all duration-500 group">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Zap size={28} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Mensual</h3>
                    <p className="text-slate-500 font-medium mb-8">Paga mes a mes sin compromisos a largo plazo.</p>

                    <div className="flex items-baseline gap-1 mb-8">
                        <span className="text-5xl font-black text-slate-900">$199</span>
                        <span className="text-slate-400 font-bold">MXN/mes</span>
                    </div>

                    <ul className="space-y-4 mb-10">
                        {["Whatsapps Ilimitados", "Recordatorios de Citas", "Recuperación de Clientes", "Soporte Estándar"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                <ShieldCheck size={18} className="text-teal-500" /> {item}
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => handleUpgrade("monthly")}
                        disabled={processing}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-teal-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {processing ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                        Seleccionar Plan Mensual
                    </button>
                </div>

                {/* Annual Card (Featured) */}
                <div className="relative bg-white rounded-[2.5rem] p-8 border-2 border-teal-500 shadow-2xl shadow-teal-100 hover:-translate-y-2 transition-all duration-500 group overflow-hidden">
                    <div className="absolute top-0 right-0 bg-teal-500 text-white px-6 py-2 rounded-bl-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-2">
                        <Heart size={12} className="fill-white" /> Recomendado
                    </div>

                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Sparkles size={28} className="text-teal-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Anual</h3>
                    <p className="text-slate-500 font-medium mb-8 italic">Ahorra $789 MXN al año (4 meses gratis).</p>

                    <div className="flex flex-col mb-8">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-slate-900">$1,599</span>
                            <span className="text-slate-400 font-bold">MXN/año</span>
                        </div>
                        <span className="text-teal-600 text-xs font-black mt-1">$133/mes aprox.</span>
                    </div>

                    <ul className="space-y-4 mb-10">
                        {["Todo lo del Mensual", "Soporte Prioritario VIP", "Acceso Previo a Funciones", "Consultoría Mensual Gratis"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-slate-700 font-black text-sm">
                                <ShieldCheck size={18} className="text-teal-500" /> {item}
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => handleUpgrade("annual")}
                        disabled={processing}
                        className="w-full py-4 bg-teal-500 text-white rounded-2xl font-black text-sm hover:bg-teal-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-100 disabled:opacity-50"
                    >
                        {processing ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                        Seleccionar Plan Anual
                    </button>
                </div>
            </div>

            {/* Help/Security Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-100">
                <div className="flex gap-4 items-start">
                    <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 text-sm">Pago Seguro</h4>
                        <p className="text-slate-500 text-xs font-medium mt-1">Procesado por Stripe con encriptación AES-256.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 text-sm">Sin Comisiones</h4>
                        <p className="text-slate-500 text-xs font-medium mt-1">El precio que ves es el que pagas, sin cargos ocultos.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                        <Heart size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 text-sm">Cancela Cuando Quieras</h4>
                        <p className="text-slate-500 text-xs font-medium mt-1">Sin plazos de permanencia ni letras chiquitas.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
