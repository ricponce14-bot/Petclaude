"use client";
import { useState } from "react";
import Link from "next/link";
import {
    Check, Calendar, MessageSquare, ArrowRight, Heart,
    ClipboardList, Bell, Users, Send, BarChart3, DollarSign,
    Smartphone, Package, Bot, Zap, ChevronRight
} from "lucide-react";
import RegisterModal from "@/components/auth/RegisterModal";

export default function LandingPage() {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("monthly");

    const openRegister = (plan: string = "monthly") => {
        setSelectedPlan(plan);
        setIsRegisterOpen(true);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 overflow-x-hidden">
            <RegisterModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                initialPlan={selectedPlan}
            />

            {/* ─── NAVBAR ─── */}
            <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <img src="/images/logo-color.png" alt="Ladrido" className="w-[110px] xs:w-[130px] md:w-[160px] h-auto object-contain" />
                    <div className="flex items-center gap-2 sm:gap-6">
                        <a href="#features" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors hidden md:block">Funciones</a>
                        <a href="#precios" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors hidden md:block">Precios</a>
                        <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                            Iniciar sesión
                        </Link>
                        <button
                            onClick={() => openRegister("monthly")}
                            className="btn-primary text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5"
                        >
                            <span className="hidden xs:inline">Probar gratis</span>
                            <span className="xs:hidden">Gratis</span>
                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── HERO — Dark Premium ─── */}
            <section className="pt-24 md:pt-32 pb-16 md:pb-24 relative overflow-hidden bg-charcoal">
                {/* Blobs decorativos */}
                <div className="absolute top-0 -right-32 w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[80px] pointer-events-none" />

                <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

                        {/* Left */}
                        <div className="animate-fade-up">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-bold mb-6">
                                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                                El CRM para estéticas caninas
                            </div>

                            <h1 className="text-4xl xs:text-5xl md:text-6xl font-black tracking-tight mb-5 leading-[1.08] text-white">
                                Gestiona tu<br />
                                estética canina<br />
                                <span className="text-gradient-premium">de forma inteligente</span>
                            </h1>

                            <p className="text-base md:text-lg text-white/60 max-w-lg mb-8 leading-relaxed">
                                Agenda citas, lleva historiales, controla gastos y deja que nuestro bot de WhatsApp atienda a tus clientes 24/7 — todo desde un solo lugar.
                            </p>

                            <div className="flex flex-col xs:flex-row gap-3">
                                <button
                                    onClick={() => openRegister("monthly")}
                                    className="btn-primary text-sm xs:text-base px-6 xs:px-8 py-3.5"
                                >
                                    Empezar prueba gratis <ArrowRight size={16} />
                                </button>
                                <a href="#features" className="btn-secondary text-sm xs:text-base px-6 xs:px-8 py-3.5 border-white/20 text-white/80 hover:bg-white/10 hover:text-white bg-transparent">
                                    Ver funciones
                                </a>
                            </div>

                            <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-white/40">
                                {["Sin tarjeta de crédito", "7 días gratis", "Cancela cuando quieras"].map(t => (
                                    <span key={t} className="flex items-center gap-1.5">
                                        <Check size={13} className="text-teal-400" /> {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Right — Preview cards mobile-friendly */}
                        <div className="relative flex flex-col gap-3 lg:block">
                            {/* Card principal */}
                            <div className="glass-dark rounded-3xl p-5 lg:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Citas de hoy</p>
                                    <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full font-bold">3 pendientes</span>
                                </div>
                                {[
                                    { time: "10:00", pet: "Max", owner: "Carlos R.", service: "Baño + Corte", color: "bg-teal-400" },
                                    { time: "11:30", pet: "Luna", owner: "María G.", service: "Baño", color: "bg-violet-400" },
                                    { time: "14:00", pet: "Rocky", owner: "José M.", service: "Vacuna", color: "bg-emerald-400" },
                                ].map(a => (
                                    <div key={a.time} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                                        <span className="text-xs font-black text-white/30 w-10">{a.time}</span>
                                        <div className={`w-2 h-2 rounded-full ${a.color} shrink-0`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-bold truncate">{a.pet}</p>
                                            <p className="text-white/40 text-xs">{a.owner} · {a.service}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Floating chips */}
                            <div className="flex gap-2 lg:absolute lg:-bottom-4 lg:left-4 lg:right-4">
                                <div className="flex-1 glass-dark rounded-2xl px-4 py-3 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-teal-500/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Bell size={15} className="text-teal-400" />
                                    </div>
                                    <div>
                                        <p className="text-white text-xs font-bold">Recordatorio enviado</p>
                                        <p className="text-white/40 text-[11px]">WhatsApp automático</p>
                                    </div>
                                </div>
                                <div className="flex-1 glass-dark rounded-2xl px-4 py-3 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-violet-500/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Bot size={15} className="text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-white text-xs font-bold">Bot activo</p>
                                        <p className="text-white/40 text-[11px]">5 conversaciones hoy</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── STATS BAR ─── */}
            <section className="bg-cream py-8 border-y border-cream-warm">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {[
                            { value: "24/7", label: "Bot de WhatsApp activo" },
                            { value: "100%", label: "En la nube, sin instalar" },
                            { value: "0", label: "Recordatorios olvidados" },
                            { value: "∞", label: "Citas y clientes" },
                        ].map(s => (
                            <div key={s.label}>
                                <p className="text-3xl md:text-4xl font-black text-charcoal">{s.value}</p>
                                <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FEATURES — BENTO GRID ─── */}
            <section id="features" className="py-20 md:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                            Todo lo que necesita tu estética
                        </h2>
                        <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto">
                            Una sola plataforma para agenda, clientes, inventario y automatización por WhatsApp.
                        </p>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

                        {/* Card grande — WhatsApp Bot */}
                        <div className="bento-card-dark xs:col-span-2 lg:col-span-2 p-7 md:p-9 group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-12 h-12 bg-teal-500/20 rounded-2xl flex items-center justify-center">
                                    <Bot size={24} className="text-teal-400" />
                                </div>
                                <span className="text-xs bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full font-bold">Estrella</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-white mb-3">Bot de WhatsApp con IA</h3>
                            <p className="text-white/50 text-sm leading-relaxed mb-6">
                                El bot atiende a tus clientes 24/7: agenda citas, responde preguntas sobre horarios y precios, confirma asistencias y envía recordatorios automáticamente.
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                {["Agendar citas", "Recordatorios", "Confirmaciones", "Reagendar"].map(t => (
                                    <span key={t} className="text-xs bg-white/10 text-white/60 px-3 py-1.5 rounded-xl font-medium">{t}</span>
                                ))}
                            </div>
                        </div>

                        {/* Card — Agenda */}
                        <div className="bento-card-light p-6 group">
                            <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                                <Calendar size={22} className="text-blue-600" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">Agenda de citas</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Vista diaria con duración, servicio y datos de la mascota. Navega entre días con un toque.</p>
                        </div>

                        {/* Card — Historial */}
                        <div className="bento-card-lavender p-6 group">
                            <div className="w-11 h-11 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
                                <ClipboardList size={22} className="text-violet-600" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">Historial clínico</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">Registra servicios, vacunas, alergias y temperamento. Siempre a la mano antes de cada cita.</p>
                        </div>

                        {/* Card — Clientes */}
                        <div className="bento-card-light p-6 group">
                            <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                                <Users size={22} className="text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">Gestión de clientes</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">CRM completo para dueños y mascotas. Búsqueda rápida y perfiles detallados.</p>
                        </div>

                        {/* Card Teal grande — Recordatorios */}
                        <div className="bento-card-teal xs:col-span-2 p-7 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Bell size={22} className="text-white" />
                                </div>
                                <h3 className="text-xl font-black text-white">Recordatorios automáticos</h3>
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed mb-4">
                                24h antes de cada cita, tu bot envía un mensaje de WhatsApp al cliente. Él confirma o reagenda sin que tú muevas un dedo.
                            </p>
                            <div className="bg-white/10 rounded-2xl p-4 text-white/70 text-xs font-mono">
                                "Hola María 👋 Mañana a las 10:00 tienes cita para Luna..."
                            </div>
                        </div>

                        {/* Card — Gastos */}
                        <div className="bento-card-light p-6 group">
                            <div className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                                <DollarSign size={22} className="text-orange-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">Control de gastos</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Registra insumos, renta y nómina. Desglose por categoría y totales mensuales.</p>
                        </div>

                        {/* Card — Inventario */}
                        <div className="bento-card-light p-6 group">
                            <div className="w-11 h-11 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                                <Package size={22} className="text-teal-600" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">Inventario</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Control de stock con alertas cuando se acaben tus insumos clave.</p>
                        </div>

                        {/* Card — Tickets */}
                        <div className="bento-card-light p-6 group">
                            <div className="w-11 h-11 bg-pink-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-pink-100 transition-colors">
                                <Send size={22} className="text-pink-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">Tickets por WhatsApp</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Envía comprobante del servicio al terminar cada cita. Profesional y automático.</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section className="py-20 md:py-28 bg-white">
                <div className="max-w-5xl mx-auto px-5 sm:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">Listo en 3 pasos</h2>
                        <p className="text-base text-slate-500">Sin instalaciones, sin complicaciones.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
                        <div className="hidden md:block absolute top-8 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200" />
                        {[
                            { n: "01", title: "Crea tu cuenta", desc: "Regístra tu estética en minutos. Agrega clientes, mascotas y empieza a agendar desde el primer día.", icon: Zap },
                            { n: "02", title: "Conecta WhatsApp", desc: "Escanea el código QR y el bot empezará a atender a tus clientes automáticamente.", icon: MessageSquare },
                            { n: "03", title: "Automatiza y crece", desc: "Reduce inasistencias, recupera clientes y lleva el control financiero de tu negocio.", icon: BarChart3 },
                        ].map(s => (
                            <div key={s.n} className="relative bg-slate-50 rounded-3xl p-7 text-center group hover:bg-white hover:shadow-lg transition-all duration-300">
                                <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                                    <s.icon size={24} className="text-white" />
                                </div>
                                <p className="text-xs font-black text-teal-500 mb-2 tracking-widest">{s.n}</p>
                                <h3 className="text-lg font-black text-slate-900 mb-2">{s.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── PRICING ─── */}
            <section id="precios" className="py-20 md:py-28 bg-slate-50">
                <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">Precios simples</h2>
                    <p className="text-base md:text-lg text-slate-500 mb-12 max-w-lg mx-auto">
                        Todos los planes incluyen 7 días de prueba gratis. Sin tarjeta de crédito.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
                        {/* Monthly */}
                        <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <h3 className="text-lg font-black text-slate-900 mb-1">Mensual</h3>
                            <p className="text-slate-500 text-sm mb-6">Flexibilidad mes a mes.</p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-5xl font-black text-slate-900">$199</span>
                                <span className="text-slate-400 font-medium">MXN / mes</span>
                            </div>
                            <ul className="space-y-2.5 mb-7">
                                {["Citas ilimitadas", "Clientes y mascotas ilimitados", "Recordatorios por WhatsApp", "Mensajes automáticos", "Control de gastos e inventario", "Soporte técnico"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                                        <Check className="text-teal-500 shrink-0" size={16} />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => openRegister("monthly")} className="btn-secondary w-full justify-center py-3.5 rounded-2xl">
                                Empezar 7 días gratis
                            </button>
                        </div>

                        {/* Annual — highlighted */}
                        <div className="relative bg-charcoal rounded-3xl p-7 shadow-2xl shadow-charcoal/20 hover:-translate-y-2 transition-all duration-300">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-500 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-teal-500/30">
                                <Heart size={11} className="fill-white" /> Mejor valor
                            </div>
                            <h3 className="text-lg font-black text-white mb-1">Anual</h3>
                            <p className="text-white/40 text-sm mb-6">Ahorras $789 MXN al año</p>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-5xl font-black text-white">$1,599</span>
                                <span className="text-white/40 font-medium">MXN / año</span>
                            </div>
                            <p className="text-teal-400 text-sm font-bold mb-6">= $133 MXN al mes</p>
                            <ul className="space-y-2.5 mb-7">
                                {["Todo lo del plan mensual", "WhatsApp sin restricciones", "Acceso anticipado a nuevas funciones", "Soporte VIP prioritario"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/70 text-sm">
                                        <Check className="text-teal-400 shrink-0" size={16} />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => openRegister("annual")} className="btn-primary w-full justify-center py-3.5 rounded-2xl">
                                Empezar 7 días gratis <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CTA FINAL ─── */}
            <section className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                        ¿Listo para transformar tu estética?
                    </h2>
                    <p className="text-base md:text-lg text-slate-500 mb-8">
                        Únete a las estéticas caninas que ya gestionan su negocio de forma inteligente.
                    </p>
                    <button
                        onClick={() => openRegister("monthly")}
                        className="btn-primary text-base px-8 py-4"
                    >
                        Empezar ahora — gratis <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="bg-charcoal text-white/40 pt-12 pb-8">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
                        <img src="/images/logo-white.png" alt="Ladrido" className="w-[130px] md:w-[160px] h-auto object-contain" />
                        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
                            <a href="#features" className="hover:text-white transition-colors">Funciones</a>
                            <a href="#precios" className="hover:text-white transition-colors">Precios</a>
                            <a href="#" className="hover:text-white transition-colors">Términos</a>
                            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                        </div>
                    </div>
                    <div className="pt-6 text-center text-sm">
                        <p>&copy; {new Date().getFullYear()} Ladrido Software. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
