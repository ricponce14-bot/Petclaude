"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Calendar, MessageSquare, Bone, ArrowRight, Star, Heart } from "lucide-react";
import RegisterModal from "@/components/auth/RegisterModal";

export default function LandingPage() {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("monthly");

    const openRegister = (plan: string = "monthly") => {
        setSelectedPlan(plan);
        setIsRegisterOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-slate-900 overflow-x-hidden">
            <RegisterModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                initialPlan={selectedPlan}
            />

            {/* Navbar Premium Orgánico */}
            <header className="fixed w-full top-0 z-50 transition-all duration-300 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-[0_8px_16px_-6px_rgba(20,184,166,0.5)] transform -rotate-6">
                            <span className="text-xl">🐾</span>
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-900">
                            Ladrido
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
                            Iniciar sesión
                        </Link>
                        <button
                            onClick={() => openRegister("monthly")}
                            className="group relative inline-flex items-center justify-center gap-2 text-sm font-bold bg-slate-900 text-white px-6 py-3 rounded-2xl hover:bg-slate-800 transition-all shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.4)] hover:-translate-y-0.5"
                        >
                            Probar 7 días gratis
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section Rediseñado "No-IA" */}
            <main className="flex-1 flex flex-col items-center relative text-center pt-40 pb-20 md:pt-48 md:pb-32 px-6">
                {/* Elementos decorativos asimétricos orgánicos */}
                <div className="absolute top-20 left-10 md:left-20 w-72 h-72 bg-teal-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
                <div className="absolute top-40 right-10 md:right-20 w-72 h-72 bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-orange-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

                <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/60 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] text-slate-800 text-sm font-semibold mb-8 backdrop-blur-md">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                        El único CRM que envía Whatsapps por ti
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1] text-slate-900">
                        Agenda llena.<br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">
                            Cero inasistencias.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        Ladrido es la plataforma premium para estéticas caninas. Agendamos tus citas, guardamos historiales y nuestro robot de WhatsApp confirma asistencias y recupera clientes perdidos automáticamente.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
                        <button
                            onClick={() => openRegister("monthly")}
                            className="w-full sm:w-auto px-8 py-4 bg-teal-500 text-white rounded-2xl font-bold text-base transition-all shadow-[0_8px_24px_-8px_rgba(20,184,166,0.6)] hover:shadow-[0_12px_28px_-8px_rgba(20,184,166,0.7)] hover:-translate-y-1 hover:bg-teal-400"
                        >
                            Empezar prueba gratis
                        </button>
                        <a href="#precios" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 rounded-2xl font-bold text-base hover:bg-slate-50 transition-all border border-slate-200 shadow-sm hover:shadow-md">
                            Ver precios
                        </a>
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <img key={i} className="w-8 h-8 rounded-full border-2 border-white" src={`https://i.pravatar.cc/100?img=${10 + i}`} alt="user" />
                            ))}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                            <Star size={16} className="text-yellow-400 fill-yellow-400" />
                            <Star size={16} className="text-yellow-400 fill-yellow-400" />
                            <Star size={16} className="text-yellow-400 fill-yellow-400" />
                            <Star size={16} className="text-yellow-400 fill-yellow-400" />
                            <Star size={16} className="text-yellow-400 fill-yellow-400" />
                        </div>
                        <span className="ml-1">Veterinarias confiando</span>
                    </div>
                </div>

                {/* Imagen principal con efecto organic shadow */}
                <div className="mt-20 w-full max-w-5xl mx-auto relative px-4 z-10">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] via-transparent to-transparent z-20 top-1/2" />
                    <div className="relative rounded-[2rem] p-2 bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.1)] overflow-hidden transform perspective-1000 rotateX-2">
                        <img
                            src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=2071&auto=format&fit=crop"
                            alt="Dashboard Ladrido Preview"
                            className="w-full rounded-[1.5rem] object-cover aspect-video max-h-[600px] shadow-inner"
                        />
                    </div>
                </div>
            </main>

            {/* Grid de Características Orgánico */}
            <section id="features" className="py-32 relative z-30 bg-white border-y border-slate-100">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-20 max-w-2xl mx-auto">
                        <h2 className="text-4xl font-black text-slate-900 mb-6">El trabajo sucio, automatizado.</h2>
                        <p className="text-lg text-slate-500 font-medium">Ladrido fue diseñado tras analizar más de 1,000 interacciones en estéticas caninas reales. Es simple, intuitivo y poderoso.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Calendar}
                            color="bg-purple-100 text-purple-600"
                            shadow="shadow-[0_8px_20px_-8px_rgba(168,85,247,0.3)]"
                            title="Citas inteligentes"
                            desc="Anota la cita en segundos. El sistema aparta el espacio y agenda el recordatorio automático al cliente por WhatsApp 24h antes."
                        />
                        <FeatureCard
                            icon={MessageSquare}
                            color="bg-teal-100 text-teal-600"
                            shadow="shadow-[0_8px_20px_-8px_rgba(20,184,166,0.3)]"
                            title="Motor de WhatsApp"
                            desc="¿Un cliente lleva 30 días sin venir? Ladrido le enviará un WhatsApp 100% personalizable invitándolo a volver con una promo."
                        />
                        <FeatureCard
                            icon={Bone}
                            color="bg-orange-100 text-orange-600"
                            shadow="shadow-[0_8px_20px_-8px_rgba(249,115,22,0.3)]"
                            title="Historial Clínico Vital"
                            desc="Ten a la mano si la mascota es nerviosa, alergias y el detalle de cada baño o vacuna pasada antes de recibirla."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Premium */}
            <section id="precios" className="py-32 bg-[#FAFAFA] relative">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-teal-50/50 skew-x-12 transform origin-top-right -z-10" />
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-black text-slate-900 mb-6">Precios simples y transparentes</h2>
                    <p className="text-lg text-slate-500 mb-16 max-w-xl mx-auto font-medium">Elige el plan que mejor se adapte a tu estética. Ambos incluyen todas las funciones y 7 días de prueba gratis.</p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                        {/* Plan Mensual */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] transition-shadow">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Mensual</h3>
                                <p className="text-slate-500 font-medium">Flexibilidad mes a mes para tu negocio.</p>
                            </div>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-5xl font-black text-slate-900">$199</span>
                                <span className="text-lg text-slate-500 font-semibold">MXN / mes</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {["Goo", "Dueños y mascotas ilimitados", "Recordatorios de citas", "Mensajes automáticos por WhatsApp", "Plantillas 100% editables", "Soporte técnico"].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                                        <Check className="text-teal-500 mt-0.5 shrink-0" size={20} />
                                        <span>{item === "Goo" ? <del className="opacity-50 text-sm">Goo</del> : item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => openRegister("monthly")}
                                className="block w-full py-4 text-center bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                            >
                                Empezar 7 días gratis
                            </button>
                        </div>

                        {/* Plan Anual (Destacado) */}
                        <div className="relative bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4)] transform md:-translate-y-4">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-400 to-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                                <Heart size={14} className="fill-white" /> Recomendado
                            </div>
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2">Anual</h3>
                                <p className="text-slate-400 font-medium">Ahorras más de 4 meses ($789 MXN)</p>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-5xl font-black text-white">$1,599</span>
                                <span className="text-lg text-slate-400 font-semibold">MXN / año</span>
                            </div>
                            <p className="text-teal-400 text-sm font-bold mb-8">Equivale a $133 MXN al mes</p>

                            <ul className="space-y-4 mb-8">
                                {["Todas las funciones del mensual", "Dueños y mascotas ilimitados", "WhatsApp sin restricciones", "Acceso prioritario a nuevas funciones", "Soporte VIP"].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300 font-medium">
                                        <Check className="text-teal-400 mt-0.5 shrink-0" size={20} />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => openRegister("annual")}
                                className="block w-full py-4 text-center bg-teal-500 text-white rounded-2xl font-bold hover:bg-teal-400 transition-all shadow-[0_8px_20px_-8px_rgba(20,184,166,0.6)]"
                            >
                                Empezar 7 días gratis
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Orgánico */}
            <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm font-medium">
                        <div className="flex items-center gap-2 mb-6 md:mb-0">
                            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center -rotate-6">
                                <span>🐾</span>
                            </div>
                            <span className="text-slate-900 font-bold text-lg">Ladrido</span>
                        </div>
                        <div className="flex gap-6 mb-6 md:mb-0">
                            <a href="#" className="hover:text-slate-900 transition-colors">Términos</a>
                            <a href="#" className="hover:text-slate-900 transition-colors">Privacidad</a>
                            <a href="#" className="hover:text-slate-900 transition-colors">Contacto</a>
                        </div>
                        <p className="text-slate-400">© {new Date().getFullYear()} Ladrido Software.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc, color, shadow }: any) {
    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-100/50 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] flex flex-col items-start text-left hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] transition-all group">
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 ${shadow} transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                <Icon size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-500 text-base leading-relaxed font-medium">{desc}</p>
        </div>
    );
}
