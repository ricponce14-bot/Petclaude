"use client";
import { X, Check } from "lucide-react";
import SteppedRegisterForm from "./SteppedRegisterForm";

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPlan?: string;
}

export default function RegisterModal({ isOpen, onClose, initialPlan = "monthly" }: RegisterModalProps) {
    if (!isOpen) return null;

    const handleSuccess = (url: string) => {
        window.location.href = url;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end xs:items-center justify-center p-0 xs:p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />

            {/* Sheet / Modal */}
            <div className="relative bg-white w-full xs:max-w-lg md:max-w-4xl rounded-t-[2rem] xs:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom xs:zoom-in-95 duration-300 max-h-[95dvh] flex flex-col md:flex-row">

                {/* Close */}
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
                >
                    <X size={18} />
                </button>

                {/* ── Left panel — solo desktop ── */}
                <div className="hidden md:flex flex-col justify-between w-[300px] shrink-0 bg-charcoal p-8 text-white relative overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -right-10 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <img src="/images/logo-white.png" alt="Ladrido" className="w-[130px] h-auto mb-8 object-contain" />
                        <h2 className="text-2xl font-black leading-tight mb-3 text-white">
                            Tu estética, en piloto automático
                        </h2>
                        <p className="text-white/50 text-sm leading-relaxed">
                            Configura tu negocio en 2 minutos y empieza a automatizar citas por WhatsApp.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-3">
                        {[
                            "Agenda inteligente por WhatsApp",
                            "Recordatorios automáticos 24h antes",
                            "Control de clientes y mascotas",
                            "Gastos e inventario incluidos",
                        ].map((b, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
                                    <Check size={10} className="text-teal-400" strokeWidth={3} />
                                </div>
                                <span className="text-white/60 text-xs font-medium">{b}</span>
                            </div>
                        ))}
                        <p className="text-white/30 text-xs pt-2">7 días gratis · Sin tarjeta · Cancela cuando quieras</p>
                    </div>
                </div>

                {/* ── Right panel — Form ── */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 xs:p-8">
                        {/* Mobile header */}
                        <div className="md:hidden mb-6">
                            <h2 className="text-xl font-black text-slate-900">Crea tu cuenta</h2>
                            <p className="text-sm text-slate-500 mt-1">7 días gratis · Sin tarjeta</p>
                        </div>
                        {/* Desktop header */}
                        <div className="hidden md:block mb-6">
                            <h2 className="text-2xl font-black text-slate-900">Crea tu cuenta</h2>
                            <p className="text-sm text-slate-500 mt-1">Prueba gratis por 7 días, sin riesgos.</p>
                        </div>

                        <SteppedRegisterForm initialPlan={initialPlan} onSuccess={handleSuccess} />
                    </div>
                </div>
            </div>
        </div>
    );
}
