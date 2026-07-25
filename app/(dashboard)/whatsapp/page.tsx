"use client";
// app/(dashboard)/whatsapp/page.tsx
// Vinculación de WhatsApp con el número central de Apúntame (Cloud API oficial).
// Ya NO hay QR de sesión ni instancias: el dueño se vincula enviando un código
// de activación de un solo uso al número central, y comparte su link público
// para que los clientes le escriban al bot.

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MessageCircle, QrCode, Copy, Check, RefreshCw, Loader2,
  Bell, Sun, Mic, CalendarCheck, Users, ExternalLink, Wallet,
} from "lucide-react";

interface WaStatus {
  negocio: string | null;
  vinculado: boolean;
  duenos: number;
  public: { codigo: string; link: string | null } | null;
  central_number: string | null;
}

interface Activation {
  token: string;
  expires_at: string;
  link: string;
}

function qrUrl(data: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(data)}`;
}

function CopyButton({ text, label = "Copiar link" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.button
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard no disponible */ }
      }}
      className="flex items-center gap-2 px-3.5 py-2 rounded-[14px] text-xs font-bold
                 bg-teal-50 text-[#00C4AA] hover:bg-[#00C4AA] hover:text-white
                 border border-teal-50 transition-colors"
    >
      {copied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> {label}</>}
    </motion.button>
  );
}

export default function WhatsAppPage() {
  const [status, setStatus] = useState<WaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activation, setActivation] = useState<Activation | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/activation-link");
      if (res.ok) setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Mientras hay una activación pendiente: countdown + polling del estado
  // (cuando el dueño manda el mensaje, `vinculado` cambia a true).
  useEffect(() => {
    if (!activation) return;
    const tick = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(activation.expires_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        setActivation(null);
        setSecondsLeft(null);
      }
    }, 1000);
    const poll = setInterval(fetchStatus, 5000);
    return () => { clearInterval(tick); clearInterval(poll); };
  }, [activation, fetchStatus]);

  const generateActivation = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/whatsapp/activation-link", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.activation) {
        setActivation(data.activation);
        if (data.public && status) setStatus({ ...status, public: data.public });
      } else {
        alert(data.error || "No se pudo generar el código de activación");
      }
    } catch (e: any) {
      alert(`Error de red: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-[#00C4AA] border-t-transparent rounded-full" />
      </div>
    );
  }

  const mmss = secondsLeft != null
    ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`
    : null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-[#1A1A1A] flex items-center gap-2">
          WhatsApp <span className="text-[#9e8a7a] font-medium text-lg">·</span>
          <span className="text-[#FF8C42]">Mía</span> <Sparkles size={18} className="text-[#FF8C42]" />
        </h1>
        <p className="text-sm text-[#9e8a7a] font-medium mt-1">
          Tu asistente por WhatsApp en el número central de Apúntame — sin QR de sesión, sin desconexiones.
        </p>
      </div>

      {/* ── Card principal: estado / activación ────── */}
      <div className="bg-white border border-[#F0E6D8] rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6">
        {status?.vinculado ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center rounded-[16px] bg-teal-50 border border-teal-100">
                <MessageCircle size={20} className="text-[#00C4AA]" />
              </div>
              <div>
                <p className="font-black text-[#1A1A1A]">Mía está activa 🐾</p>
                <p className="text-xs text-[#9e8a7a] font-medium">
                  {status.duenos} teléfono{status.duenos === 1 ? "" : "s"} de encargado vinculado{status.duenos === 1 ? "" : "s"}
                  {status.negocio ? ` · ${status.negocio}` : ""}
                </p>
              </div>
            </div>

            <div className="bg-[#FFF9F0] border border-[#F0E6D8] rounded-[18px] p-4 text-sm text-[#9e8a7a] font-medium leading-relaxed">
              Escríbele a Mía desde tu WhatsApp o mándale un audio:{" "}
              <span className="text-[#1A1A1A] font-bold">"agéndale a Laura mañana a las 4"</span>,{" "}
              <span className="text-[#1A1A1A] font-bold">"¿cuántas citas tengo hoy?"</span>,{" "}
              <span className="text-[#1A1A1A] font-bold">"registra un gasto de 350 de shampoo"</span>…
            </div>

            <button
              onClick={generateActivation}
              disabled={generating}
              className="flex items-center gap-2 text-xs font-bold text-[#9e8a7a] hover:text-[#FF8C42] transition-colors disabled:opacity-60"
            >
              {generating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Vincular otro teléfono o cambié de número
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center rounded-[16px] bg-[#FFF4EC] border border-orange-100">
                <Sparkles size={20} className="text-[#FF8C42]" />
              </div>
              <div>
                <p className="font-black text-[#1A1A1A]">Activa a Mía en tu WhatsApp</p>
                <p className="text-xs text-[#9e8a7a] font-medium">
                  Un solo mensaje desde tu teléfono y quedas vinculado. El código dura 15 minutos.
                </p>
              </div>
            </div>

            {!activation && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={generateActivation}
                disabled={generating || !status?.central_number}
                className="w-full bg-[#FF8C42] text-white font-black py-3.5 rounded-[18px]
                           hover:bg-[#f07d30] transition-colors disabled:opacity-60
                           shadow-[0_8px_24px_rgba(255,140,66,0.35)]"
              >
                {generating ? "Generando código…" : "Activar WhatsApp"}
              </motion.button>
            )}

            {!status?.central_number && (
              <p className="text-xs text-red-400 font-bold text-center">
                Falta configurar NEXT_PUBLIC_WHATSAPP_NUMBER (número central) en el entorno.
              </p>
            )}
          </div>
        )}

        {/* ── Activación pendiente: link + QR + countdown ── */}
        <AnimatePresence>
          {activation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-5 border-t border-[#F0E6D8] pt-5 flex flex-col items-center gap-4">
                <div className="border-4 border-[#FF8C42] rounded-[22px] p-2 bg-white">
                  <img src={qrUrl(activation.link)} alt="QR de activación" className="w-48 h-48 rounded-[12px]" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-black text-[#1A1A1A]">
                    Escanea con tu teléfono o abre el link, y <span className="text-[#FF8C42]">envía el mensaje</span> tal cual
                  </p>
                  <p className="text-xs text-[#9e8a7a] font-medium">
                    Código <span className="font-black text-[#1A1A1A]">ACTIVAR-{activation.token}</span>
                    {mmss && <> · expira en <span className="font-black text-[#FF8C42]">{mmss}</span></>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.a
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    href={activation.link} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-[14px] text-xs font-bold
                               bg-[#00C4AA] text-white hover:bg-[#00b09a] transition-colors"
                  >
                    <ExternalLink size={13} /> Abrir en WhatsApp
                  </motion.a>
                  <CopyButton text={activation.link} />
                </div>
                <p className="text-[11px] text-[#9e8a7a] text-center font-medium">
                  En cuanto Mía reciba tu mensaje, esta página se actualiza sola. ✨
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Link público para clientes ─────────────── */}
      {status?.public?.link && (
        <div className="bg-white border border-[#F0E6D8] rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-center">
            <div className="border border-[#F0E6D8] rounded-[18px] p-2 bg-white shrink-0">
              <img src={qrUrl(status.public.link, 160)} alt="QR para clientes" className="w-36 h-36 rounded-[10px]" />
            </div>
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <QrCode size={16} className="text-[#00C4AA]" />
                <p className="font-black text-[#1A1A1A]">Tu link para clientes</p>
              </div>
              <p className="text-sm text-[#9e8a7a] font-medium leading-relaxed">
                Compártelo en redes, tu bio o imprímelo en tu local. Cualquier cliente que lo use
                cae directo con el bot de <span className="font-bold text-[#1A1A1A]">{status.negocio ?? "tu negocio"}</span> para
                agendar su cita. Es permanente: código{" "}
                <span className="font-black text-[#1A1A1A]">{status.public.codigo}</span>.
              </p>
              <div className="flex gap-2 justify-center sm:justify-start">
                <CopyButton text={status.public.link} />
                <motion.a
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  href={status.public.link} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-[14px] text-xs font-bold
                             bg-[#FFF4EC] text-[#FF8C42] hover:bg-[#FF8C42] hover:text-white
                             border border-orange-100 transition-colors"
                >
                  <ExternalLink size={13} /> Probar
                </motion.a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Qué hace Mía / automatizaciones ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { icon: Mic,           title: "Habla o escribe a Mía",   desc: "“Agéndale a Karla el viernes a las 11” — texto o nota de voz, ella lo entiende" },
          { icon: Wallet,        title: "Registra gastos al vuelo", desc: "“Gasté 350 en shampoo” y queda guardado en tu módulo de gastos" },
          { icon: CalendarCheck, title: "Agenda y disponibilidad",  desc: "Pregúntale cuántas citas tienes hoy o qué horas tienes libres mañana" },
          { icon: Bell,          title: "Recordatorio 24h",         desc: "Tus clientes reciben recordatorio oficial un día antes y confirman ahí mismo" },
          { icon: Sun,           title: "Resumen diario 8am",       desc: "Cada mañana Mía te manda cuántas citas tienes en el día" },
          { icon: Users,         title: "Varios encargados",        desc: "Vincula más de un teléfono: todos pueden administrar por WhatsApp" },
        ].map((item) => (
          <div key={item.title} className="flex gap-3 bg-white rounded-[18px] border border-[#F0E6D8] px-4 py-3.5">
            <div className="w-9 h-9 flex items-center justify-center rounded-[12px] bg-[#FFF9F0] border border-[#F0E6D8] shrink-0">
              <item.icon size={16} className="text-[#FF8C42]" />
            </div>
            <div>
              <p className="text-sm font-black text-[#1A1A1A]">{item.title}</p>
              <p className="text-xs text-[#9e8a7a] font-medium mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
