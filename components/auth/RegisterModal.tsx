"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, X, Check, ArrowRight } from "lucide-react";

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPlan?: string;
}

export default function RegisterModal({ isOpen, onClose, initialPlan = "monthly" }: RegisterModalProps) {
    const supabase = createClient();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState(1); // 1: Form, 2: Plan Selection

    if (!isOpen) return null;

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            // Success! Now redirect to Stripe or show plan selection
            try {
                const res = await fetch("/api/stripe/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: authData.user.email, id: authData.user.id, plan: initialPlan })
                });

                const { url, error: checkoutError } = await res.json();

                if (checkoutError) {
                    setError(checkoutError);
                    setLoading(false);
                    return;
                }

                if (url) {
                    window.location.href = url;
                }
            } catch (err) {
                console.error(err);
                setError("Error conectando con la pasarela de pago.");
                setLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all z-10"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col md:flex-row">
                    {/* Left Side: Branding/Value Prop */}
                    <div className="hidden md:flex flex-col justify-between w-48 bg-teal-500 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-[-20%] left-[-20%] w-full h-full bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <span className="text-4xl mb-6 block">🐾</span>
                            <h2 className="text-xl font-black leading-tight mb-4">Únete a la manada</h2>
                            <p className="text-xs font-medium text-teal-50 opacity-90 leading-relaxed">
                                Más de 500 estéticas caninas ya están automatizando su negocio con Ladrido.
                            </p>
                        </div>
                        <div className="relative z-10 mt-8 space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                                        <Check size={10} className="text-white" />
                                    </div>
                                    <span className="text-[10px] font-bold">Ventaja {i}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="flex-1 p-8 md:p-10">
                        <div className="mb-8">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Crea tu cuenta</h1>
                            <p className="text-slate-500 font-medium text-sm mt-1">Prueba gratis por 7 días, sin riesgos.</p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email del negocio</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-medium text-slate-800"
                                    placeholder="contacto@estetica.com"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Contraseña</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-medium text-slate-800"
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && (
                                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-bold animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-teal-500 transition-all disabled:opacity-60 text-base shadow-lg shadow-slate-200 hover:shadow-teal-100 hover:-translate-y-0.5 mt-4"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                                {loading ? "Preparando todo..." : "Comenzar ahora"}
                            </button>

                            <p className="text-[10px] text-center font-semibold text-slate-400 mt-6 leading-relaxed">
                                Al registrarte aceptas nuestra Política de Privacidad.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
