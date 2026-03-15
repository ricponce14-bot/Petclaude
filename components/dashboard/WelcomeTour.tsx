"use client";
// components/dashboard/WelcomeTour.tsx
import { useState, useEffect } from "react";
import { X, QrCode, Bot, Users, CalendarDays, ArrowRight } from "lucide-react";

const STORAGE_KEY = "ladrido_welcomed_v1";

const steps = [
    {
        icon: QrCode,
        color: "bg-mint/10 text-mint",
        title: "Conecta tu WhatsApp",
        desc: "Ve a WhatsApp → escanea el código QR. Tu bot empezará a responder automáticamente.",
        href: "/whatsapp",
        cta: "Conectar ahora",
    },
    {
        icon: Bot,
        color: "bg-sand/15 text-sand-dark",
        title: "Configura tu Bot",
        desc: "Personaliza el mensaje de bienvenida, servicios y precios que el bot enviará a tus clientes.",
        href: "/bot",
        cta: "Configurar bot",
    },
    {
        icon: Users,
        color: "bg-mint/10 text-mint",
        title: "Agrega tu primer cliente",
        desc: "Registra a tus clientes y sus mascotas para llevar un control completo.",
        href: "/clientes",
        cta: "Agregar cliente",
    },
    {
        icon: CalendarDays,
        color: "bg-sand/15 text-sand-dark",
        title: "Agenda tu primera cita",
        desc: "Programa citas manualmente o déjale el trabajo al bot automático.",
        href: "/agenda",
        cta: "Ver agenda",
    },
];

export default function WelcomeTour() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            setVisible(true);
        }
    }, []);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, "1");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0 bg-black/40 backdrop-blur-sm animate-fade-up">
            <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-slate-100 w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-5 pb-4 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <img src="/images/logo-color.png" alt="Ladrido" className="h-6 w-auto object-contain" />
                        </div>
                        <h2 className="text-lg font-black text-ink">¡Bienvenido a Ladrido!</h2>
                        <p className="text-slate-400 text-xs mt-0.5">Sigue estos pasos para empezar</p>
                    </div>
                    <button
                        onClick={dismiss}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0 mt-0.5"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Steps */}
                <div className="p-4 space-y-2">
                    {steps.map(({ icon: Icon, color, title, desc, href, cta }, i) => (
                        <a
                            key={i}
                            href={href}
                            onClick={dismiss}
                            className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                                <Icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-ink leading-tight">{title}</p>
                                <p className="text-xs text-slate-400 font-medium mt-0.5 leading-snug">{desc}</p>
                            </div>
                            <ArrowRight size={15} className="text-slate-300 group-hover:text-mint transition-colors shrink-0" />
                        </a>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 pt-2">
                    <button
                        onClick={dismiss}
                        className="btn-primary w-full justify-center py-3"
                    >
                        Entendido, ¡a trabajar!
                    </button>
                </div>
            </div>
        </div>
    );
}
