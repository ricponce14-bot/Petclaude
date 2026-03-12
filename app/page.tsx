"use client";
import { useState } from "react";
import Link from "next/link";
import {
    Check, Calendar, MessageSquare, ArrowRight, Heart,
    ClipboardList, Bell, Users, Send, BarChart3, DollarSign,
    Smartphone, Shield, Zap
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
                    <img src="/images/logo-color.png" alt="Ladrido" className="w-[120px] xs:w-[140px] md:w-[180px] h-auto object-contain" />
                    <div className="flex items-center gap-3 sm:gap-6">
                        <a href="#features" className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors hidden md:block">
                            Funciones
                        </a>
                        <a href="#precios" className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors hidden md:block">
                            Precios
                        </a>
                        <Link href="/login" className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                            Iniciar sesion
                        </Link>
                        <button
                            onClick={() => openRegister("monthly")}
                            className="group inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-bold bg-teal-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5"
                        >
                            <span className="hidden xs:inline">Probar 7 dias gratis</span>
                            <span className="xs:hidden">Probar gratis</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── HERO ─── */}
            <section className="pt-32 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50" />
                <div className="absolute top-20 -right-40 w-[500px] h-[500px] rounded-full bg-teal-100/40 blur-3xl" />
                <div className="absolute bottom-0 -left-40 w-[400px] h-[400px] rounded-full bg-emerald-100/30 blur-3xl" />

                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-sm font-semibold mb-6">
                                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                                El CRM que automatiza tu estetica canina
                            </div>

                            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
                                Gestiona tu estetica canina de forma
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500"> inteligente</span>
                            </h1>

                            <p className="text-lg text-slate-600 max-w-lg mb-8 leading-relaxed">
                                Ladrido es la plataforma todo-en-uno para esteticas caninas. Agenda citas, lleva historiales, controla gastos y envia recordatorios automaticos por WhatsApp.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => openRegister("monthly")}
                                    className="px-8 py-4 bg-teal-500 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 hover:bg-teal-600"
                                >
                                    Empezar prueba gratis
                                </button>
                                <a href="#features" className="px-8 py-4 bg-white text-slate-700 rounded-xl font-bold text-base hover:bg-slate-50 transition-all border border-slate-200 shadow-sm text-center">
                                    Conocer funciones
                                </a>
                            </div>

                            <div className="mt-8 flex items-center gap-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <Check size={16} className="text-teal-500" />
                                    <span>Sin tarjeta de credito</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Check size={16} className="text-teal-500" />
                                    <span>7 dias gratis</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Check size={16} className="text-teal-500" />
                                    <span>Cancela cuando quieras</span>
                                </div>
                            </div>
                        </div>

                        {/* Hero Image / Dashboard Preview */}
                        <div className="relative hidden lg:block">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200/50">
                                <img
                                    src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=2071&auto=format&fit=crop"
                                    alt="Dashboard Ladrido"
                                    className="w-full object-cover aspect-[4/3]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                            </div>
                            {/* Floating card */}
                            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl border border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                                    <Bell size={20} className="text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Recordatorio enviado</p>
                                    <p className="text-[11px] text-slate-400">WhatsApp automatico</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── FEATURES GRID ─── */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                            Todo lo que necesitas para tu estetica
                        </h2>
                        <p className="text-lg text-slate-500">
                            Una plataforma completa desde la agenda hasta los recordatorios automaticos por WhatsApp.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={Calendar}
                            title="Agenda de Citas"
                            desc="Organiza y gestiona tus citas diarias. Vista por dia con duracion, tipo de servicio y datos de la mascota."
                        />
                        <FeatureCard
                            icon={ClipboardList}
                            title="Historial Clinico"
                            desc="Registra cada servicio: banos, cortes, vacunas. Ten alergias y temperamento siempre a la mano."
                        />
                        <FeatureCard
                            icon={MessageSquare}
                            title="WhatsApp Automatico"
                            desc="Recordatorios de cita, recuperacion de clientes inactivos y felicitaciones de cumpleanos automaticos."
                        />
                        <FeatureCard
                            icon={Users}
                            title="Gestion de Clientes"
                            desc="Base de datos completa de duenos y mascotas. Busqueda rapida y perfiles detallados."
                        />
                        <FeatureCard
                            icon={Send}
                            title="Tickets por WhatsApp"
                            desc="Envia comprobantes de servicio al terminar cada cita directamente al WhatsApp del cliente."
                        />
                        <FeatureCard
                            icon={DollarSign}
                            title="Control de Gastos"
                            desc="Registra insumos, renta, nomina y servicios. Desglose por categoria y totales mensuales."
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Indicadores"
                            desc="Dashboard con metricas clave: citas del dia, clientes activos, ingresos y tendencias."
                        />
                        <FeatureCard
                            icon={Smartphone}
                            title="Acceso Multi-dispositivo"
                            desc="Usa Ladrido desde tu laptop, tablet o celular. Funciona desde cualquier navegador."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Datos Seguros"
                            desc="Informacion protegida con cifrado y aislamiento por veterinaria. Solo tu accedes a tus datos."
                        />
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                            Transforma tu estetica canina con Ladrido
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Descubre como Ladrido optimiza cada aspecto de tu operacion, desde la agenda hasta el seguimiento automatico de clientes.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <StepCard
                            number="01"
                            title="Registra tu estetica"
                            desc="Crea tu cuenta en minutos. Agrega tus clientes, mascotas y empieza a agendar citas desde el primer dia."
                        />
                        <StepCard
                            number="02"
                            title="Conecta WhatsApp"
                            desc="Escanea el codigo QR y Ladrido comenzara a enviar recordatorios y notificaciones automaticamente."
                        />
                        <StepCard
                            number="03"
                            title="Automatiza y crece"
                            desc="Reduce inasistencias, recupera clientes perdidos y lleva el control financiero de tu negocio."
                        />
                    </div>
                </div>
            </section>

            {/* ─── SOCIAL PROOF ─── */}
            <section className="py-20 bg-gradient-to-r from-teal-500 to-emerald-500">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8 text-center text-white">
                        <div>
                            <p className="text-5xl font-black mb-2">100%</p>
                            <p className="text-teal-100 font-medium">Basado en la nube</p>
                        </div>
                        <div>
                            <p className="text-5xl font-black mb-2">24/7</p>
                            <p className="text-teal-100 font-medium">Acceso desde cualquier lugar</p>
                        </div>
                        <div>
                            <p className="text-5xl font-black mb-2">100%</p>
                            <p className="text-teal-100 font-medium">Seguro y confiable</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── PRICING ─── */}
            <section id="precios" className="py-24 bg-slate-50">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Precios simples y transparentes</h2>
                    <p className="text-lg text-slate-500 mb-16 max-w-xl mx-auto">
                        Elige el plan que mejor se adapte a tu estetica. Todos incluyen 7 dias de prueba gratis.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                        {/* Monthly */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-slate-900 mb-1">Mensual</h3>
                                <p className="text-slate-500 text-sm">Flexibilidad mes a mes para tu negocio.</p>
                            </div>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-5xl font-black text-slate-900">$199</span>
                                <span className="text-lg text-slate-400 font-medium">MXN / mes</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {["Citas ilimitadas", "Clientes y mascotas ilimitados", "Recordatorios de citas por WhatsApp", "Mensajes automaticos", "Plantillas editables", "Control de gastos", "Soporte tecnico"].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                                        <Check className="text-teal-500 mt-0.5 shrink-0" size={18} />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => openRegister("monthly")}
                                className="block w-full py-3.5 text-center bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                            >
                                Empezar 7 dias gratis
                            </button>
                        </div>

                        {/* Annual */}
                        <div className="relative bg-slate-900 rounded-2xl p-8 border border-slate-700 shadow-xl transform md:-translate-y-4">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                                <Heart size={12} className="fill-white" /> Recomendado
                            </div>
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-1">Anual</h3>
                                <p className="text-slate-400 text-sm">Ahorras mas de 4 meses ($789 MXN)</p>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-5xl font-black text-white">$1,599</span>
                                <span className="text-lg text-slate-400 font-medium">MXN / ano</span>
                            </div>
                            <p className="text-teal-400 text-sm font-bold mb-8">Equivale a $133 MXN al mes</p>

                            <ul className="space-y-3 mb-8">
                                {["Todo lo del plan mensual", "WhatsApp sin restricciones", "Acceso prioritario a nuevas funciones", "Soporte VIP", "Actualizaciones gratuitas"].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                                        <Check className="text-teal-400 mt-0.5 shrink-0" size={18} />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => openRegister("annual")}
                                className="block w-full py-3.5 text-center bg-teal-500 text-white rounded-xl font-bold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/25"
                            >
                                Empezar 7 dias gratis
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                        Listo para transformar tu estetica?
                    </h2>
                    <p className="text-lg text-slate-500 mb-8">
                        Unete a las esteticas caninas que ya gestionan su negocio de forma inteligente con Ladrido.
                    </p>
                    <button
                        onClick={() => openRegister("monthly")}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 hover:bg-teal-600"
                    >
                        Empezar ahora <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
                        <img src="/images/logo-white.png" alt="Ladrido" className="w-[150px] md:w-[200px] h-auto object-contain" />
                        <div className="flex gap-8 text-sm font-medium">
                            <a href="#features" className="hover:text-white transition-colors">Funciones</a>
                            <a href="#precios" className="hover:text-white transition-colors">Precios</a>
                            <a href="#" className="hover:text-white transition-colors">Terminos</a>
                            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                        </div>
                    </div>
                    <div className="pt-8 text-center text-sm">
                        <p>&copy; {new Date().getFullYear()} Ladrido Software. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-50 transition-all group">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}

function StepCard({ number, title, desc }: { number: string; title: string; desc: string }) {
    return (
        <div className="text-center p-8">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-black text-teal-500">{number}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-500 leading-relaxed">{desc}</p>
        </div>
    );
}
