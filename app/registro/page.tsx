"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RegistroPage() {
    const supabase = createClient();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // 1. Registro en Supabase Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        if (!authData.user) {
            setError("Usuario no creado.");
            setLoading(false);
            return;
        }

        // El Trigger "handle_new_user" en SQL ya creó el Tenant en la BD.
        // 2. Llamada a la API local para crear la sesión de Stripe Checkout y redirigir
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const plan = urlParams.get('plan') || 'monthly';

            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: authData.user.email, id: authData.user.id, plan })
            });

            const { url, error: checkoutError } = await res.json();

            if (checkoutError) {
                setError(checkoutError);
                setLoading(false);
                return;
            }

            if (url) {
                window.location.href = url; // Redirige al Checkout de Stripe
            }
        } catch (err) {
            console.error(err);
            setError("Error conectando con la pasarela de pago.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-soft-purple border border-slate-100 w-full max-w-sm p-8 hover:-translate-y-1 transition-all duration-300">
                <div className="text-center mb-6">
                    <img src="/images/logo-color.png" alt="Ladrido" className="w-[160px] md:w-[180px] h-auto mx-auto mb-4 object-contain" />
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Crea tu cuenta</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 mb-2">Comienza tus 7 días de prueba gratis</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-slate-700">Email de la clínica</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-800"
                            placeholder="contacto@veterinaria.com"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-700">Contraseña secreta</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-800"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-bold">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-teal-500 transition-all disabled:opacity-60 text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                        {loading ? "Preparando pago..." : "Registrarme"}
                    </button>

                    <p className="text-xs text-center font-semibold text-slate-400 mt-6 px-4 leading-relaxed">
                        Al registrarte aceptas los Términos y Condiciones. Cancelación garantizada o te devolvemos tu dinero.
                    </p>
                </form>
            </div>
        </div>
    );
}
