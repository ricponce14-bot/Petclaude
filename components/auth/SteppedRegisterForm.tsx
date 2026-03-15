"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Loader2, ArrowRight, ArrowLeft, Check, User, Building2,
    Settings, Phone, MapPin, Clock, ChevronRight
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────
interface FormData {
    // Step 1
    ownerName: string;
    email: string;
    password: string;
    ownerPhone: string;
    // Step 2
    businessName: string;
    city: string;
    businessPhone: string;
    // Step 3
    services: ServiceItem[];
    hours: Record<string, { enabled: boolean; open: string; close: string }>;
    slotDuration: number;
}

interface ServiceItem {
    key: string;
    label: string;
    price: number;
    duration_min: number;
    enabled: boolean;
}

interface Props {
    initialPlan?: string;
    onSuccess?: (url: string) => void;
}

// ─── Defaults ────────────────────────────────────────────
const DEFAULT_SERVICES: ServiceItem[] = [
    { key: "bath",        label: "Baño",          price: 250, duration_min: 60,  enabled: true },
    { key: "haircut",     label: "Corte",          price: 200, duration_min: 60,  enabled: true },
    { key: "bath_haircut",label: "Baño + Corte",   price: 400, duration_min: 90,  enabled: true },
    { key: "vaccine",     label: "Vacuna",         price: 150, duration_min: 30,  enabled: false },
    { key: "checkup",     label: "Chequeo",        price: 300, duration_min: 45,  enabled: false },
];

const DEFAULT_HOURS: Record<string, { enabled: boolean; open: string; close: string }> = {
    lun: { enabled: true,  open: "09:00", close: "18:00" },
    mar: { enabled: true,  open: "09:00", close: "18:00" },
    mie: { enabled: true,  open: "09:00", close: "18:00" },
    jue: { enabled: true,  open: "09:00", close: "18:00" },
    vie: { enabled: true,  open: "09:00", close: "18:00" },
    sab: { enabled: true,  open: "09:00", close: "15:00" },
    dom: { enabled: false, open: "10:00", close: "14:00" },
};

const DAY_LABELS: Record<string, string> = {
    lun: "Lun", mar: "Mar", mie: "Mié", jue: "Jue", vie: "Vie", sab: "Sáb", dom: "Dom"
};

// ─── Step indicator ───────────────────────────────────────
const STEPS = [
    { label: "Tu cuenta",  icon: User },
    { label: "Tu negocio", icon: Building2 },
    { label: "Configuración", icon: Settings },
];

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((s, i) => {
                const done    = i < current;
                const active  = i === current;
                return (
                    <div key={i} className="flex items-center">
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                                done   ? "bg-teal-500 text-white shadow-md shadow-teal-200"  :
                                active ? "bg-charcoal text-white shadow-md shadow-charcoal/20" :
                                         "bg-slate-100 text-slate-400"
                            }`}>
                                {done ? <Check size={15} strokeWidth={3} /> : <span>{i + 1}</span>}
                            </div>
                            <span className={`text-[10px] font-bold hidden xs:block transition-colors ${active ? "text-slate-900" : "text-slate-400"}`}>
                                {s.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`w-12 xs:w-16 h-0.5 mb-4 mx-1 transition-colors duration-500 ${done ? "bg-teal-400" : "bg-slate-200"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Input helper ─────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">{label}</label>
            {children}
        </div>
    );
}

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-500/15 focus:border-teal-400 transition-all placeholder:text-slate-300";

// ─── Main component ───────────────────────────────────────
export default function SteppedRegisterForm({ initialPlan = "monthly", onSuccess }: Props) {
    const supabase = createClient();
    const [step, setStep]     = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState("");

    const [form, setForm] = useState<FormData>({
        ownerName: "", email: "", password: "", ownerPhone: "",
        businessName: "", city: "", businessPhone: "",
        services: DEFAULT_SERVICES,
        hours: DEFAULT_HOURS,
        slotDuration: 60,
    });

    const set = (key: keyof FormData, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    // ── Step navigation ──────────────────────────────────
    const next = () => { setError(""); setStep(s => s + 1); };
    const back = () => { setError(""); setStep(s => s - 1); };

    // ── Step validation ──────────────────────────────────
    const canProceedStep0 = form.ownerName.trim() && form.email.trim() && form.password.length >= 6;
    const canProceedStep1 = form.businessName.trim() && form.city.trim();

    // ── Final submit ─────────────────────────────────────
    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        try {
            // 1. Sign up
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: form.email.trim(),
                password: form.password,
                options: {
                    data: {
                        full_name: form.ownerName.trim(),
                        business_name: form.businessName.trim(),
                        phone: form.ownerPhone.trim() || null,
                    }
                }
            });

            if (signUpError) throw new Error(signUpError.message);
            if (!authData.user) throw new Error("Usuario no creado.");

            // 2. Setup business data + initial bot_config
            const enabledServices = form.services
                .filter(s => s.enabled)
                .map(({ key, label, price, duration_min }) => ({ key, label, price, duration_min }));

            const businessHours: Record<string, { open: string; close: string }> = {};
            Object.entries(form.hours).forEach(([day, h]) => {
                if (h.enabled) businessHours[day] = { open: h.open, close: h.close };
            });

            const setupRes = await fetch("/api/auth/setup-business", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: authData.user.id,
                    businessName: form.businessName.trim(),
                    city: form.city.trim(),
                    businessPhone: form.businessPhone.trim() || null,
                    services: enabledServices,
                    businessHours,
                    slotDuration: form.slotDuration,
                })
            });

            const setupData = await setupRes.json();
            if (!setupRes.ok) throw new Error(setupData.error || "Error al guardar configuración.");

            // Refrescar sesión para que el JWT incluya el tenant_id recién asignado
            await supabase.auth.refreshSession();

            // 3. Stripe checkout
            const checkoutRes = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: authData.user.email, id: authData.user.id, plan: initialPlan })
            });

            const { url, error: checkoutError, details } = await checkoutRes.json();
            if (checkoutError) throw new Error(details ? `${checkoutError}: ${details}` : checkoutError);
            if (!url) throw new Error("No se pudo obtener URL de pago.");

            if (onSuccess) onSuccess(url);
            else window.location.href = url;

        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────
    return (
        <div className="w-full">
            <StepIndicator current={step} />

            {/* ── STEP 0: Cuenta ────────────────────────────── */}
            {step === 0 && (
                <div className="space-y-4 animate-fade-up">
                    <Field label="Tu nombre completo">
                        <input className={inputCls} placeholder="María García"
                            value={form.ownerName} onChange={e => set("ownerName", e.target.value)} />
                    </Field>
                    <Field label="Email del negocio">
                        <input className={inputCls} type="email" placeholder="contacto@estetica.com"
                            value={form.email} onChange={e => set("email", e.target.value)} />
                    </Field>
                    <Field label="Contraseña">
                        <input className={inputCls} type="password" placeholder="Mínimo 6 caracteres"
                            value={form.password} onChange={e => set("password", e.target.value)} minLength={6} />
                    </Field>
                    <Field label="Tu teléfono (opcional)">
                        <input className={inputCls} type="tel" placeholder="55 1234 5678"
                            value={form.ownerPhone} onChange={e => set("ownerPhone", e.target.value)} />
                    </Field>

                    {error && <ErrorBox msg={error} />}

                    <button onClick={next} disabled={!canProceedStep0}
                        className="btn-primary w-full justify-center py-4 mt-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0">
                        Siguiente <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* ── STEP 1: Negocio ───────────────────────────── */}
            {step === 1 && (
                <div className="space-y-4 animate-fade-up">
                    <Field label="Nombre de tu estética">
                        <input className={inputCls} placeholder="Estética Canina Luna"
                            value={form.businessName} onChange={e => set("businessName", e.target.value)} />
                    </Field>
                    <Field label="Ciudad">
                        <input className={inputCls} placeholder="Ciudad de México"
                            value={form.city} onChange={e => set("city", e.target.value)} />
                    </Field>
                    <Field label="WhatsApp del negocio (opcional)">
                        <div className="relative">
                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input className={`${inputCls} pl-10`} type="tel" placeholder="521XXXXXXXXXX"
                                value={form.businessPhone} onChange={e => set("businessPhone", e.target.value)} />
                        </div>
                    </Field>

                    {error && <ErrorBox msg={error} />}

                    <div className="flex gap-3 mt-2">
                        <button onClick={back} className="btn-secondary flex-none px-5 py-4">
                            <ArrowLeft size={16} />
                        </button>
                        <button onClick={next} disabled={!canProceedStep1}
                            className="btn-primary flex-1 justify-center py-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0">
                            Siguiente <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 2: Configuración ─────────────────────── */}
            {step === 2 && (
                <div className="space-y-6 animate-fade-up">
                    {/* Servicios */}
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1 mb-3">Servicios que ofreces</p>
                        <div className="space-y-2">
                            {form.services.map((svc, i) => (
                                <div key={svc.key}
                                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                        svc.enabled
                                            ? "border-teal-300 bg-teal-50"
                                            : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                    onClick={() => {
                                        const updated = [...form.services];
                                        updated[i] = { ...svc, enabled: !svc.enabled };
                                        set("services", updated);
                                    }}
                                >
                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                                        svc.enabled ? "border-teal-500 bg-teal-500" : "border-slate-300"
                                    }`}>
                                        {svc.enabled && <Check size={11} strokeWidth={3} className="text-white" />}
                                    </div>
                                    <span className="flex-1 text-sm font-bold text-slate-800">{svc.label}</span>
                                    {svc.enabled && (
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <span className="text-slate-400 text-xs">$</span>
                                            <input
                                                className="w-20 text-right bg-white border border-teal-200 rounded-xl px-2 py-1 text-sm font-black text-teal-700 focus:outline-none focus:border-teal-400"
                                                type="number" value={svc.price}
                                                onChange={e => {
                                                    const updated = [...form.services];
                                                    updated[i] = { ...svc, price: parseInt(e.target.value) || 0 };
                                                    set("services", updated);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Días laborales */}
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1 mb-3">Días y horario</p>
                        <div className="space-y-2">
                            {Object.entries(form.hours).map(([day, h]) => (
                                <div key={day} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                                    h.enabled ? "border-teal-200 bg-teal-50/50" : "border-slate-100 bg-slate-50"
                                }`}>
                                    {/* Toggle día */}
                                    <button
                                        onClick={() => {
                                            const updated = { ...form.hours };
                                            updated[day] = { ...h, enabled: !h.enabled };
                                            set("hours", updated);
                                        }}
                                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all shrink-0 ${
                                            h.enabled ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-500"
                                        }`}
                                    >
                                        {DAY_LABELS[day]}
                                    </button>

                                    {h.enabled ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <Clock size={13} className="text-slate-400 shrink-0" />
                                            <input type="time" value={h.open}
                                                onChange={e => {
                                                    const updated = { ...form.hours };
                                                    updated[day] = { ...h, open: e.target.value };
                                                    set("hours", updated);
                                                }}
                                                className="flex-1 bg-white border border-teal-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                                            />
                                            <span className="text-slate-400 text-xs">–</span>
                                            <input type="time" value={h.close}
                                                onChange={e => {
                                                    const updated = { ...form.hours };
                                                    updated[day] = { ...h, close: e.target.value };
                                                    set("hours", updated);
                                                }}
                                                className="flex-1 bg-white border border-teal-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium">Cerrado</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Duración de slot */}
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1 mb-3">Duración de cada cita</p>
                        <div className="grid grid-cols-4 gap-2">
                            {[30, 45, 60, 90].map(d => (
                                <button key={d} onClick={() => set("slotDuration", d)}
                                    className={`py-3 rounded-2xl text-sm font-black transition-all ${
                                        form.slotDuration === d
                                            ? "bg-charcoal text-white shadow-md"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`}>
                                    {d} min
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <ErrorBox msg={error} />}

                    <div className="flex gap-3">
                        <button onClick={back} className="btn-secondary flex-none px-5 py-4">
                            <ArrowLeft size={16} />
                        </button>
                        <button onClick={handleSubmit} disabled={loading}
                            className="btn-primary flex-1 justify-center py-4 disabled:opacity-50 disabled:translate-y-0">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
                            {loading ? "Creando tu cuenta..." : "Continuar al pago"}
                        </button>
                    </div>

                    <p className="text-[11px] text-center text-slate-400 leading-relaxed">
                        7 días gratis · Sin tarjeta requerida · Cancela cuando quieras
                    </p>
                </div>
            )}
        </div>
    );
}

function ErrorBox({ msg }: { msg: string }) {
    return (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 font-bold">
            {msg}
        </div>
    );
}
