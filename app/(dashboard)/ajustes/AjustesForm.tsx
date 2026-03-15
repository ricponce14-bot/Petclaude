"use client";
// app/(dashboard)/ajustes/AjustesForm.tsx
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2, Phone, MapPin, Mail, User, Shield, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
    tenant: {
        id: string;
        name: string;
        email: string;
        city: string | null;
        phone: string | null;
        plan: string;
        created_at: string;
    } | null;
    userEmail: string;
}

export default function AjustesForm({ tenant, userEmail }: Props) {
    const supabase = createClient();

    // Business info
    const [name, setName]     = useState(tenant?.name ?? "");
    const [city, setCity]     = useState(tenant?.city ?? "");
    const [phone, setPhone]   = useState(tenant?.phone ?? "");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved]   = useState(false);
    const [bizError, setBizError] = useState("");

    // Password change
    const [newPwd, setNewPwd]         = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdDone, setPwdDone]       = useState(false);
    const [pwdError, setPwdError]     = useState("");

    const inputCls =
        "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 " +
        "focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint transition-all placeholder:text-slate-300";

    const handleSaveBusiness = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setBizError(""); setSaved(false);

        const res = await fetch("/api/tenant", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, city, phone }),
        });

        setSaving(false);
        if (!res.ok) {
            const d = await res.json();
            setBizError(d.error || "Error al guardar");
        } else {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPwd !== confirmPwd) { setPwdError("Las contraseñas no coinciden."); return; }
        if (newPwd.length < 6) { setPwdError("Mínimo 6 caracteres."); return; }

        setPwdLoading(true); setPwdError(""); setPwdDone(false);
        const { error } = await supabase.auth.updateUser({ password: newPwd });
        setPwdLoading(false);

        if (error) { setPwdError(error.message); return; }
        setPwdDone(true);
        setNewPwd(""); setConfirmPwd("");
        setTimeout(() => setPwdDone(false), 4000);
    };

    const planLabel: Record<string, string> = {
        trial: "Prueba gratuita",
        active: "Plan activo",
        past_due: "Pago pendiente",
        cancelled: "Cancelado",
    };

    const planColor: Record<string, string> = {
        trial: "bg-sand/15 text-sand-dark",
        active: "bg-mint/10 text-mint",
        past_due: "bg-red-50 text-red-600",
        cancelled: "bg-slate-100 text-slate-500",
    };

    return (
        <div className="space-y-5">
            {/* ── Información del negocio ── */}
            <section className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                    <div className="w-8 h-8 bg-mint/10 rounded-lg flex items-center justify-center shrink-0">
                        <Building2 size={16} className="text-mint" />
                    </div>
                    <h2 className="font-bold text-ink text-base">Datos del negocio</h2>
                </div>

                <form onSubmit={handleSaveBusiness} className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Nombre del negocio</label>
                        <input
                            className={`${inputCls} mt-1.5`}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Estética Canina Luna"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Ciudad</label>
                            <div className="relative mt-1.5">
                                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                <input
                                    className={`${inputCls} pl-9`}
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    placeholder="Ciudad de México"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">WhatsApp del negocio</label>
                            <div className="relative mt-1.5">
                                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                <input
                                    className={`${inputCls} pl-9`}
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="521XXXXXXXXXX"
                                />
                            </div>
                        </div>
                    </div>

                    {bizError && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 font-medium">
                            {bizError}
                        </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                        {saved && (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-mint">
                                <CheckCircle2 size={14} /> Cambios guardados
                            </span>
                        )}
                        <div className={saved ? "" : "ml-auto"}>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </div>
                </form>
            </section>

            {/* ── Cuenta ── */}
            <section className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                    <div className="w-8 h-8 bg-sand/15 rounded-lg flex items-center justify-center shrink-0">
                        <User size={16} className="text-sand-dark" />
                    </div>
                    <h2 className="font-bold text-ink text-base">Cuenta</h2>
                </div>
                <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <Mail size={15} className="text-slate-400 shrink-0" />
                        <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Email</p>
                            <p className="text-sm font-semibold text-ink">{userEmail}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <Shield size={15} className="text-slate-400 shrink-0" />
                        <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Plan</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${planColor[tenant?.plan ?? "trial"] ?? planColor.trial}`}>
                                {planLabel[tenant?.plan ?? "trial"] ?? tenant?.plan}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Cambiar contraseña ── */}
            <section className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        <Shield size={16} className="text-slate-500" />
                    </div>
                    <h2 className="font-bold text-ink text-base">Cambiar contraseña</h2>
                </div>
                <form onSubmit={handleChangePassword} className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Nueva contraseña</label>
                            <input
                                type="password"
                                className={`${inputCls} mt-1.5`}
                                value={newPwd}
                                onChange={e => setNewPwd(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Confirmar contraseña</label>
                            <input
                                type="password"
                                className={`${inputCls} mt-1.5`}
                                value={confirmPwd}
                                onChange={e => setConfirmPwd(e.target.value)}
                                placeholder="Repetir contraseña"
                            />
                        </div>
                    </div>

                    {pwdError && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 font-medium">
                            {pwdError}
                        </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                        {pwdDone && (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-mint">
                                <CheckCircle2 size={14} /> Contraseña actualizada
                            </span>
                        )}
                        <div className={pwdDone ? "" : "ml-auto"}>
                            <button
                                type="submit"
                                disabled={pwdLoading || !newPwd}
                                className="btn-secondary px-5 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {pwdLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                                {pwdLoading ? "Actualizando..." : "Actualizar contraseña"}
                            </button>
                        </div>
                    </div>
                </form>
            </section>
        </div>
    );
}
