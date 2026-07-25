"use client";
// Landing de Apúntame.mx — diseño "Barro y Jade"
// Sin imágenes: todo tipografía (Metropolis), color y SVG.

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mic, CalendarCheck, Bell, QrCode, Wallet, Sun,
  ArrowRight, Check, Sparkles, MessagesSquare, Menu,
} from "lucide-react";
import { useState } from "react";
import Logo from "@/components/ui/Logo";

/* ── Tokens locales ─────────────────────────────────── */
const INK = "#241C15";
const CHILE = "#E8542F";
const JADE = "#0E8C6D";
const MARIGOLD = "#F2B035";
const BONE = "#FBF5EC";
const LINE = "#EADDC8";

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as any },
};

/* ── Chat mockup: Mía en acción ─────────────────────── */
function MiaChat() {
  return (
    <div className="relative">
      {/* halo */}
      <div className="absolute -inset-6 rounded-[48px] opacity-60 blur-2xl"
           style={{ background: `radial-gradient(60% 60% at 70% 20%, ${MARIGOLD}33, transparent), radial-gradient(50% 50% at 20% 80%, ${CHILE}26, transparent)` }} />
      <div className="relative w-full max-w-[380px] mx-auto rounded-[36px] border-[6px] border-[#1E1410] bg-[#F1E6D4] shadow-[0_32px_80px_-24px_rgba(30,20,16,0.45)] overflow-hidden">
        {/* header WhatsApp */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1E1410]">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm"
               style={{ background: JADE }}>
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold leading-none">Apúntame</p>
            <p className="text-white/40 text-[10px] mt-1">Mía · en línea</p>
          </div>
          <Sparkles size={16} className="text-[#F2B035]" />
        </div>

        {/* conversación */}
        <div className="px-3.5 py-4 space-y-2.5 text-[13px] leading-snug">
          {/* nota de voz de la dueña */}
          <div className="flex justify-end">
            <div className="flex items-center gap-2.5 rounded-2xl rounded-br-md px-3.5 py-2.5 bg-[#E9F3EE] border border-[#C4E0D5] max-w-[85%]">
              <Mic size={15} style={{ color: JADE }} className="shrink-0" />
              <div className="flex items-end gap-[2.5px] h-4" aria-hidden>
                {[7,12,9,15,6,13,10,16,8,12,5,10,14,7].map((h, i) => (
                  <span key={i} className="w-[2.5px] rounded-full" style={{ height: h, background: JADE, opacity: 0.75 }} />
                ))}
              </div>
              <span className="text-[10px] font-bold text-[#0B7057]">0:06</span>
            </div>
          </div>
          <p className="text-right text-[10px] text-[#8B7A6A] italic pr-1">
            “Mía, apúntale a Laura mañana a las 4 para corte”
          </p>

          {/* respuesta de Mía */}
          <div className="flex">
            <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-white shadow-sm max-w-[88%]">
              <p><span className="font-bold">Listo ✅</span> Cita apuntada:</p>
              <div className="mt-1.5 rounded-xl px-3 py-2 text-[12px]" style={{ background: BONE, border: `1px solid ${LINE}` }}>
                <p className="font-bold" style={{ color: INK }}>Laura · Corte</p>
                <p className="text-[#8B7A6A]">mañana · 4:00 pm</p>
              </div>
              <p className="mt-1.5 text-[#8B7A6A]">Le mando su confirmación y el recordatorio un día antes 😉</p>
            </div>
          </div>

          {/* chip de sistema */}
          <div className="flex justify-center py-0.5">
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/70 text-[#8B7A6A] border" style={{ borderColor: LINE }}>
              🔔 Recordatorio enviado a Laura
            </span>
          </div>

          {/* consulta rápida */}
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-md px-3.5 py-2.5 bg-[#E9F3EE] border border-[#C4E0D5] max-w-[85%]">
              ¿cuántas citas tengo hoy?
            </div>
          </div>
          <div className="flex">
            <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-white shadow-sm max-w-[88%]">
              Hoy tienes <span className="font-bold">6 citas</span> — la primera a las 10:00 am con Karla ✂️
            </div>
          </div>
        </div>
      </div>

      {/* badges flotantes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="absolute -left-3 md:-left-10 top-16 rounded-2xl bg-white px-4 py-3 shadow-[0_16px_40px_-12px_rgba(30,20,16,0.25)] border"
        style={{ borderColor: LINE }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B7A6A]">Este mes</p>
        <p className="text-xl font-black" style={{ color: INK }}>+38 citas</p>
        <p className="text-[11px] font-bold" style={{ color: JADE }}>agendadas solas</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
        className="absolute -right-2 md:-right-8 bottom-10 rounded-2xl px-4 py-3 shadow-[0_16px_40px_-12px_rgba(232,84,47,0.45)]"
        style={{ background: CHILE }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Inasistencias</p>
        <p className="text-xl font-black text-white">−67%</p>
      </motion.div>
    </div>
  );
}

/* ── Página ─────────────────────────────────────────── */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const sectores = ["Barberías", "Estéticas", "Spas", "Clínicas", "Salones de uñas", "Consultorios", "Estudios de tatuaje", "Despachos"];

  const pasos = [
    { n: "1", title: "Crea tu cuenta", desc: "Registra tu negocio y define tus servicios, precios y horarios. Cinco minutos, sin tarjeta." },
    { n: "2", title: "Activa a Mía", desc: "Un solo mensaje de WhatsApp desde tu teléfono y tu asistente queda conectada a tu negocio." },
    { n: "3", title: "Comparte tu link", desc: "Pega tu link o QR en redes y en tu local. Tus clientes agendan solos, sin llamadas ni idas y vueltas." },
  ];

  const features = [
    { icon: Mic,           title: "Mándale un audio",        desc: "“Apúntale a Karla el viernes a las 11” — Mía entiende texto y notas de voz, y lo agenda por ti.", big: true },
    { icon: Bell,          title: "Recordatorios que confirman", desc: "Tus clientes reciben recordatorio oficial un día antes y confirman ahí mismo. Adiós inasistencias." },
    { icon: QrCode,        title: "Tu link de citas",         desc: "Un link y QR permanentes para redes, bio y mostrador. Quien lo abre, cae directo con tu bot." },
    { icon: CalendarCheck, title: "Agenda y clientes",        desc: "Todo lo que Mía agenda aterriza en tu panel: agenda del día, historial y directorio de clientes." },
    { icon: Wallet,        title: "Gastos al vuelo",          desc: "“Gasté 350 en insumos” y queda registrado. Tu control financiero, sin abrir una hoja de cálculo." },
    { icon: Sun,           title: "Resumen a las 8 am",       desc: "Cada mañana Mía te escribe cuántas citas tienes y con quién. Empiezas el día ya enterado." },
  ];

  const faqs = [
    { q: "¿Necesito un número de WhatsApp nuevo?", a: "No. Mía vive en el número oficial de Apúntame. Tú solo vinculas tu teléfono con un mensaje y tus clientes usan tu link personalizado — tu número personal queda fuera." },
    { q: "¿Mis clientes tienen que instalar algo?", a: "Nada. Abren tu link, les responde el bot en WhatsApp normal, eligen servicio y horario, y listo." },
    { q: "¿Funciona para mi giro?", a: "Si trabajas con citas, sí: barberías, estéticas, spas, clínicas, salones, consultorios, estudios y despachos. Tú defines tus servicios y precios." },
    { q: "¿Qué pasa cuando termina la prueba?", a: "Decides si sigues con el plan mensual. Sin plazos forzosos ni letras chiquitas: cancelas cuando quieras." },
  ];

  return (
    <div style={{ background: BONE, color: INK }} className="min-h-screen overflow-x-clip">

      {/* ═══ NAV ═══ */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#FBF5EC]/85 border-b" style={{ borderColor: LINE }}>
        <nav className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Apúntame.mx"><Logo size="sm" /></Link>

          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#8B7A6A]">
            <a href="#como-funciona" className="hover:text-[#241C15] transition-colors">Cómo funciona</a>
            <a href="#funciones" className="hover:text-[#241C15] transition-colors">Funciones</a>
            <a href="#precio" className="hover:text-[#241C15] transition-colors">Precio</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold px-4 py-2 rounded-xl hover:bg-white transition-colors">Entrar</Link>
            <Link href="/registro"
              className="text-sm font-bold text-white px-5 py-2.5 rounded-2xl transition-transform hover:-translate-y-0.5"
              style={{ background: INK }}>
              Prueba gratis
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
            <Menu size={22} />
          </button>
        </nav>

        {menuOpen && (
          <div className="md:hidden px-5 pb-4 space-y-2 text-sm font-bold">
            <a href="#como-funciona" onClick={() => setMenuOpen(false)} className="block py-2">Cómo funciona</a>
            <a href="#funciones" onClick={() => setMenuOpen(false)} className="block py-2">Funciones</a>
            <a href="#precio" onClick={() => setMenuOpen(false)} className="block py-2">Precio</a>
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="flex-1 text-center py-2.5 rounded-xl border" style={{ borderColor: LINE }}>Entrar</Link>
              <Link href="/registro" className="flex-1 text-center py-2.5 rounded-xl text-white" style={{ background: CHILE }}>Prueba gratis</Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative max-w-6xl mx-auto px-5 md:px-8 pt-14 md:pt-24 pb-16 md:pb-28">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-8 items-center">
          <div>
            <motion.div {...fadeUp}>
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] px-3.5 py-2 rounded-full"
                    style={{ background: "#F6DCC8", color: "#9A3517" }}>
                <MessagesSquare size={13} /> Citas por WhatsApp · Hecho en México
              </span>
            </motion.div>

            <motion.h1 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}
              className="mt-6 font-black leading-[0.98] tracking-tight text-[44px] xs:text-[52px] md:text-[68px]">
              Tu negocio<br />
              <span style={{ color: CHILE }}>agenda solo.</span>
            </motion.h1>

            <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.16 }}
              className="mt-6 text-lg md:text-xl text-[#6E5F52] font-medium leading-relaxed max-w-md">
              <span className="font-bold" style={{ color: INK }}>Mía</span>, tu asistente en WhatsApp, agenda a tus
              clientes, manda recordatorios y te pasa el corte del día. Tú solo dile —
              <span className="font-bold" style={{ color: JADE }}> hasta con una nota de voz.</span>
            </motion.p>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.24 }}
              className="mt-8 flex flex-col xs:flex-row gap-3">
              <Link href="/registro"
                className="inline-flex items-center justify-center gap-2 text-white font-black px-7 py-4 rounded-2xl text-base transition-transform hover:-translate-y-0.5 shadow-[0_16px_40px_-12px_rgba(232,84,47,0.55)]"
                style={{ background: CHILE }}>
                Empieza gratis 14 días <ArrowRight size={18} />
              </Link>
              <a href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 font-bold px-7 py-4 rounded-2xl text-base border bg-white/60 hover:bg-white transition-colors"
                style={{ borderColor: LINE }}>
                Ver cómo funciona
              </a>
            </motion.div>

            <motion.ul {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.32 }}
              className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-bold text-[#8B7A6A]">
              {["Sin tarjeta", "Sin apps para tus clientes", "Cancela cuando quieras"].map(t => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check size={14} strokeWidth={3} style={{ color: JADE }} /> {t}
                </li>
              ))}
            </motion.ul>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <MiaChat />
          </motion.div>
        </div>
      </section>

      {/* ═══ SECTORES ═══ */}
      <section className="border-y bg-white/50" style={{ borderColor: LINE }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-7 flex flex-wrap items-center justify-center gap-2.5">
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#B3A18D] mr-2">Para</span>
          {sectores.map((s) => (
            <span key={s} className="text-[13px] font-bold px-4 py-2 rounded-full bg-white border text-[#6E5F52]"
                  style={{ borderColor: LINE }}>
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ CÓMO FUNCIONA ═══ */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28">
        <motion.div {...fadeUp} className="max-w-xl">
          <p className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: JADE }}>Cómo funciona</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">
            De cero a agendando<br />en una tarde.
          </h2>
        </motion.div>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {pasos.map((p, i) => (
            <motion.div key={p.n} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}
              className="relative rounded-[28px] bg-white border p-7 overflow-hidden"
              style={{ borderColor: LINE }}>
              <span className="absolute -top-4 -right-2 text-[110px] font-black leading-none select-none"
                    style={{ color: i === 1 ? "#FAEFE5" : "#F1E6D4" }}>
                {p.n}
              </span>
              <div className="relative">
                <span className="inline-flex w-10 h-10 rounded-2xl items-center justify-center font-black text-white text-sm"
                      style={{ background: i === 1 ? CHILE : INK }}>
                  {p.n}
                </span>
                <h3 className="mt-5 text-xl font-black">{p.title}</h3>
                <p className="mt-2 text-[15px] text-[#6E5F52] font-medium leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ FUNCIONES (bento) ═══ */}
      <section id="funciones" className="py-20 md:py-28" style={{ background: "#F7ECDD" }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <motion.div {...fadeUp} className="max-w-xl">
            <p className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: CHILE }}>Funciones</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">
              Un asistente que sí<br />hace la chamba.
            </h2>
          </motion.div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: (i % 3) * 0.08 }}
                className={`rounded-[28px] p-7 border transition-transform hover:-translate-y-1 ${f.big ? "sm:col-span-2 lg:col-span-1" : ""}`}
                style={f.big
                  ? { background: INK, borderColor: INK }
                  : { background: "#FFFFFF", borderColor: LINE }}>
                <span className="inline-flex w-11 h-11 rounded-2xl items-center justify-center"
                      style={{ background: f.big ? CHILE : "#FAEFE5" }}>
                  <f.icon size={19} style={{ color: f.big ? "#fff" : CHILE }} />
                </span>
                <h3 className="mt-5 text-lg font-black" style={{ color: f.big ? "#fff" : INK }}>{f.title}</h3>
                <p className="mt-2 text-[14px] font-medium leading-relaxed"
                   style={{ color: f.big ? "rgba(255,255,255,0.6)" : "#6E5F52" }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BANDA OSCURA ═══ */}
      <section className="py-20 md:py-24" style={{ background: "#1E1410" }}>
        <div className="max-w-4xl mx-auto px-5 md:px-8 text-center">
          <motion.p {...fadeUp} className="text-[12px] font-black uppercase tracking-[0.18em]" style={{ color: MARIGOLD }}>
            La verdadera diferencia
          </motion.p>
          <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}
            className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-white leading-[1.08]">
            Deja de contestar<br />
            <span style={{ color: MARIGOLD }}>“¿tienes lugar mañana?”</span>
          </motion.h2>
          <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.16 }}
            className="mt-5 text-white/50 text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Cada mensaje que hoy contestas a mano es una cita que Mía puede agendar sola.
            Recupera tus manos — y tus tardes.
          </motion.p>
        </div>
      </section>

      {/* ═══ PRECIO ═══ */}
      <section id="precio" className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28">
        <motion.div {...fadeUp} className="text-center max-w-xl mx-auto">
          <p className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: JADE }}>Precio</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight">Un plan. Todo incluido.</h2>
          <p className="mt-4 text-[#6E5F52] font-medium">Sin niveles, sin sorpresas. Empieza con 14 días gratis.</p>
        </motion.div>

        <div className="mt-12 grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* Mensual */}
          <motion.div {...fadeUp} className="rounded-[32px] bg-white border p-8" style={{ borderColor: LINE }}>
            <p className="font-black text-sm uppercase tracking-widest text-[#8B7A6A]">Mensual</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black">$199</span>
              <span className="text-[#8B7A6A] font-bold">MXN / mes</span>
            </div>
            <p className="mt-2 text-sm text-[#8B7A6A] font-medium">Flexibilidad mes a mes.</p>
            <Link href="/registro"
              className="mt-7 flex items-center justify-center gap-2 font-black py-3.5 rounded-2xl border transition-colors hover:bg-[#FBF5EC]"
              style={{ borderColor: LINE }}>
              Probar gratis
            </Link>
          </motion.div>

          {/* Anual */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="relative rounded-[32px] p-8 text-white overflow-hidden" style={{ background: INK }}>
            <span className="absolute top-6 right-6 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
                  style={{ background: MARIGOLD, color: INK }}>
              Ahorra $789
            </span>
            <p className="font-black text-sm uppercase tracking-widest text-white/50">Anual</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black">$133</span>
              <span className="text-white/50 font-bold">MXN / mes</span>
            </div>
            <p className="mt-2 text-sm text-white/50 font-medium">$1,599 al año, en un solo pago.</p>
            <Link href="/registro"
              className="mt-7 flex items-center justify-center gap-2 font-black py-3.5 rounded-2xl text-white transition-transform hover:-translate-y-0.5"
              style={{ background: CHILE }}>
              Probar gratis <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>

        <motion.ul {...fadeUp} className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[13px] font-bold text-[#8B7A6A]">
          {["Citas y clientes ilimitados", "Mía con notas de voz", "Recordatorios oficiales", "Gastos e inventario", "Soporte humano"].map(t => (
            <li key={t} className="flex items-center gap-1.5">
              <Check size={14} strokeWidth={3} style={{ color: JADE }} /> {t}
            </li>
          ))}
        </motion.ul>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="max-w-3xl mx-auto px-5 md:px-8 pb-20 md:pb-28">
        <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-black tracking-tight text-center">
          Preguntas rápidas
        </motion.h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <motion.details key={f.q} {...fadeUp}
              className="group rounded-2xl bg-white border px-6 py-4 open:pb-5" style={{ borderColor: LINE }}>
              <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-[15px]">
                {f.q}
                <span className="ml-4 shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-lg font-black transition-transform group-open:rotate-45"
                      style={{ background: "#FAEFE5", color: CHILE }}>+</span>
              </summary>
              <p className="mt-3 text-[14px] text-[#6E5F52] font-medium leading-relaxed">{f.a}</p>
            </motion.details>
          ))}
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-20 md:pb-28">
        <motion.div {...fadeUp}
          className="relative rounded-[40px] px-8 py-14 md:py-20 text-center overflow-hidden"
          style={{ background: CHILE }}>
          <div className="absolute inset-0 opacity-20"
               style={{ background: `radial-gradient(50% 60% at 80% 10%, ${MARIGOLD}, transparent), radial-gradient(40% 50% at 10% 90%, #1E1410, transparent)` }} />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-[1.05]">
              Apúntate hoy.<br />Tu agenda se llena sola.
            </h2>
            <Link href="/registro"
              className="mt-8 inline-flex items-center gap-2 bg-white font-black px-8 py-4 rounded-2xl text-base transition-transform hover:-translate-y-0.5"
              style={{ color: CHILE }}>
              Crear mi cuenta gratis <ArrowRight size={18} />
            </Link>
            <p className="mt-4 text-white/70 text-sm font-bold">14 días gratis · sin tarjeta</p>
          </div>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: "#1E1410" }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo variant="dark" size="sm" />
          <div className="flex items-center gap-6 text-sm font-semibold text-white/40">
            <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#precio" className="hover:text-white transition-colors">Precio</a>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
          </div>
          <p className="text-white/30 text-xs font-medium">
            © {new Date().getFullYear()} Apúntame.mx · Hecho en México 🇲🇽
          </p>
        </div>
      </footer>
    </div>
  );
}
