"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MessageCircle, Send, ArrowLeft, Bot, User, Clock,
  CheckCircle2, XCircle, Search, Loader2, CalendarDays,
  PawPrint, ChevronRight, Plus, RefreshCw, Paperclip
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────
interface Conversation {
  phone: string;
  last_message: string;
  last_time: string;
  direction: string;
  message_count: number;
  owner_name?: string;
  owner_id?: string;
  state?: string;
}

interface Message {
  id: string;
  phone: string;
  body: string;
  direction: string;
  type: string;
  status: string;
  created_at: string;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  type: string;
  status: string;
  pets: { name: string } | null;
}

interface OwnerDetail {
  id: string;
  name: string;
  whatsapp: string;
  notes: string | null;
}

// ─── Constants ────────────────────────────────────────────────
const STATE_LABELS: Record<string, { label: string; color: string }> = {
  inicio:                  { label: "Menú",              color: "bg-slate-100 text-slate-600" },
  seleccionar_servicio:    { label: "Eligiendo servicio", color: "bg-blue-100 text-blue-700" },
  seleccionar_fecha:       { label: "Eligiendo fecha",    color: "bg-blue-100 text-blue-700" },
  seleccionar_hora:        { label: "Eligiendo hora",     color: "bg-blue-100 text-blue-700" },
  confirmar:               { label: "Por confirmar",      color: "bg-amber-100 text-amber-700" },
  esperando_confirmacion:  { label: "Esperando confirm.", color: "bg-purple-100 text-purple-700" },
  reagendar_seleccionar:   { label: "Reagendando",        color: "bg-sand/20 text-sand-dark" },
  reagendar_fecha:         { label: "Reagendando",        color: "bg-sand/20 text-sand-dark" },
  reagendar_hora:          { label: "Reagendando",        color: "bg-sand/20 text-sand-dark" },
  finalizado:              { label: "Finalizado",         color: "bg-mint/10 text-mint" },
};

const APPT_STATUS: Record<string, { label: string; color: string }> = {
  scheduled:  { label: "Programada", color: "bg-blue-50 text-blue-700" },
  confirmed:  { label: "Confirmada", color: "bg-mint/10 text-mint" },
  completed:  { label: "Completada", color: "bg-slate-100 text-slate-500" },
  cancelled:  { label: "Cancelada",  color: "bg-red-50 text-red-600" },
  no_show:    { label: "No asistió", color: "bg-red-50 text-red-500" },
};

// ─── Component ────────────────────────────────────────────────
export default function ConversacionesPage() {
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [owner, setOwner] = useState<OwnerDetail | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [manualMessage, setManualMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showPanel, setShowPanel] = useState(false); // mobile: toggle info panel
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch conversations ──────────────────────────────────────
  const fetchConversations = async () => {
    try {
      const { data: msgs } = await supabase
        .from("wa_messages")
        .select("phone, body, direction, created_at, type")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!msgs) { setLoading(false); return; }

      const phoneMap = new Map<string, Conversation>();
      for (const msg of msgs as any[]) {
        if (!phoneMap.has(msg.phone)) {
          phoneMap.set(msg.phone, {
            phone: msg.phone,
            last_message: msg.body,
            last_time: msg.created_at,
            direction: msg.direction || (msg.type === "bot_incoming" ? "inbound" : "outbound"),
            message_count: 1,
          });
        } else {
          phoneMap.get(msg.phone)!.message_count++;
        }
      }

      const phones = Array.from(phoneMap.keys());
      if (phones.length > 0) {
        const { data: owners } = await supabase
          .from("owners")
          .select("id, name, whatsapp")
          .in("whatsapp", phones);

        if (owners) {
          for (const o of owners as any[]) {
            const conv = phoneMap.get(o.whatsapp);
            if (conv) { conv.owner_name = o.name; conv.owner_id = o.id; }
          }
        }

        const { data: sessions } = await supabase
          .from("whatsapp_chat_sessions")
          .select("phone, state")
          .in("phone", phones);

        if (sessions) {
          for (const s of sessions as any[]) {
            const conv = phoneMap.get(s.phone);
            if (conv) conv.state = s.state;
          }
        }
      }

      const sorted = Array.from(phoneMap.values())
        .sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());

      setConversations(sorted);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  // ── Fetch messages ───────────────────────────────────────────
  const fetchMessages = async (phone: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from("wa_messages")
      .select("id, phone, body, direction, type, status, created_at")
      .eq("phone", phone)
      .order("created_at", { ascending: true })
      .limit(150);
    setMessages((data as Message[]) || []);
    setLoadingMessages(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // ── Fetch owner + appointments ───────────────────────────────
  const fetchOwnerDetails = async (phone: string) => {
    const { data: ownerData } = await supabase
      .from("owners")
      .select("id, name, whatsapp, notes")
      .eq("whatsapp", phone)
      .maybeSingle();

    setOwner((ownerData as OwnerDetail) || null);

    if (ownerData) {
      const { data: appts } = await supabase
        .from("appointments")
        .select("id, scheduled_at, type, status, pets(name)")
        .eq("owner_id", (ownerData as any).id)
        .order("scheduled_at", { ascending: false })
        .limit(10);
      setAppointments((appts as Appointment[]) || []);
    } else {
      setAppointments([]);
    }
  };

  // ── Send message ─────────────────────────────────────────────
  const sendManual = async () => {
    if (!manualMessage.trim() || !selectedPhone) return;
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_id: owner?.id || null, body: manualMessage }),
      });
      if (res.ok) {
        setManualMessage("");
        setTimeout(() => fetchMessages(selectedPhone), 1200);
      } else {
        const err = await res.json();
        alert("Error al enviar: " + (err.error || "Error desconocido"));
      }
    } catch (e: any) { alert(e.message); }
    setSending(false);
  };

  // ── Effects ──────────────────────────────────────────────────
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPhone) {
      fetchMessages(selectedPhone);
      fetchOwnerDetails(selectedPhone);
      const interval = setInterval(() => fetchMessages(selectedPhone), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedPhone]);

  const filtered = conversations.filter(c =>
    !search || c.phone.includes(search) || c.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  const upcomingAppts = appointments.filter(a => !isPast(new Date(a.scheduled_at)) || a.status === "scheduled" || a.status === "confirmed");
  const pastAppts = appointments.filter(a => isPast(new Date(a.scheduled_at)) && a.status !== "scheduled" && a.status !== "confirmed");

  const showChat = selectedPhone !== null;

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex flex-col md:flex-row overflow-hidden bg-gray-50">

      {/* ── Col 1: Lista de conversaciones ── */}
      <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-slate-100 flex flex-col shrink-0 ${showChat ? "hidden md:flex" : "flex"}`}>
        <div className="px-4 py-4 border-b border-slate-100">
          <h1 className="text-lg font-black text-ink flex items-center gap-2 mb-3">
            <MessageCircle size={20} className="text-mint" />
            Conversaciones
          </h1>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-mint" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 px-6 text-slate-400">
              <Bot size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No hay conversaciones aún</p>
              <p className="text-xs mt-1 text-slate-300">Aparecerán cuando lleguen mensajes de WhatsApp</p>
            </div>
          ) : (
            filtered.map(conv => (
              <button
                key={conv.phone}
                onClick={() => { setSelectedPhone(conv.phone); setShowPanel(false); }}
                className={`w-full text-left px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                  selectedPhone === conv.phone ? "bg-mint/5 border-l-[3px] border-l-mint" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-black ${
                  conv.owner_name ? "bg-mint/10 text-mint" : "bg-slate-100 text-slate-400"
                }`}>
                  {conv.owner_name ? conv.owner_name[0].toUpperCase() : <User size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-ink truncate">
                      {conv.owner_name || conv.phone}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatDistanceToNow(new Date(conv.last_time), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  {conv.owner_name && <p className="text-[10px] text-slate-400 font-mono">{conv.phone}</p>}
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400 truncate flex-1">
                      {conv.direction === "inbound" ? "👤 " : "🤖 "}
                      {conv.last_message?.slice(0, 45)}
                    </p>
                    {conv.state && STATE_LABELS[conv.state] && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${STATE_LABELS[conv.state].color}`}>
                        {STATE_LABELS[conv.state].label}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Col 2: Chat ── */}
      <div className={`flex-1 flex flex-col bg-slate-50 min-w-0 ${!showChat ? "hidden md:flex" : "flex"}`}>
        {!selectedPhone ? (
          <div className="flex-1 flex items-center justify-center text-slate-300">
            <div className="text-center">
              <MessageCircle size={56} className="mx-auto mb-4 opacity-20" />
              <p className="text-base font-bold">Selecciona una conversación</p>
              <p className="text-sm mt-1 text-slate-300">Elige un chat de la lista para ver el historial</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
              <button onClick={() => setSelectedPhone(null)} className="md:hidden p-2 hover:bg-slate-50 rounded-xl">
                <ArrowLeft size={18} />
              </button>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-black ${
                owner ? "bg-mint/10 text-mint" : "bg-slate-100 text-slate-400"
              }`}>
                {owner ? owner.name[0].toUpperCase() : <User size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink truncate">
                  {owner?.name || selectedPhone}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">{selectedPhone}</p>
              </div>
              {/* Bot state badge */}
              {(() => {
                const conv = conversations.find(c => c.phone === selectedPhone);
                const st = conv?.state ? STATE_LABELS[conv.state] : null;
                return st ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline ${st.color}`}>
                    {st.label}
                  </span>
                ) : null;
              })()}
              {/* Toggle info panel on mobile */}
              <button
                onClick={() => setShowPanel(p => !p)}
                className={`lg:hidden p-2 rounded-xl transition-colors ${showPanel ? "bg-mint/10 text-mint" : "hover:bg-slate-50 text-slate-400"}`}
                title="Ver info del cliente"
              >
                <CalendarDays size={18} />
              </button>
              <button
                onClick={() => { fetchMessages(selectedPhone); fetchOwnerDetails(selectedPhone); }}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-mint transition-colors"
                title="Actualizar"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Messages + info panel row */}
            <div className="flex-1 flex overflow-hidden">
              {/* Messages */}
              <div className={`flex-1 flex flex-col overflow-hidden ${showPanel ? "hidden lg:flex" : "flex"}`}>
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 size={22} className="animate-spin text-mint" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16 text-slate-300 text-sm">Sin mensajes registrados</div>
                  ) : (
                    messages.map(msg => {
                      const isInbound = msg.direction === "inbound" || msg.type === "bot_incoming";
                      return (
                        <div key={msg.id} className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                            isInbound
                              ? "bg-white border border-slate-100 rounded-bl-sm"
                              : msg.type === "manual"
                                ? "bg-slate-700 text-white rounded-br-sm"
                                : "bg-mint text-white rounded-br-sm"
                          }`}>
                            <div className={`flex items-center gap-1 mb-1 ${isInbound ? "text-slate-400" : "text-white/60"}`}>
                              {isInbound
                                ? <><User size={10} /><span className="text-[10px] font-bold">Cliente</span></>
                                : msg.type === "manual"
                                  ? <><User size={10} /><span className="text-[10px] font-bold">Tú</span></>
                                  : <><Bot size={10} /><span className="text-[10px] font-bold">Bot</span></>
                              }
                            </div>
                            <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isInbound ? "text-slate-800" : "text-white"}`}>
                              {msg.body}
                            </p>
                            <div className={`flex items-center gap-1 mt-1 ${isInbound ? "text-slate-300" : "text-white/50"}`}>
                              <Clock size={9} />
                              <span className="text-[10px]">{format(new Date(msg.created_at), "d MMM h:mm a", { locale: es })}</span>
                              {!isInbound && msg.status === "sent" && <CheckCircle2 size={9} />}
                              {!isInbound && msg.status === "failed" && <XCircle size={9} className="text-red-300" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="bg-white border-t border-slate-100 p-3 flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-300 hover:text-mint hover:bg-mint/5 rounded-xl transition-all"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input
                    type="text"
                    value={manualMessage}
                    onChange={e => setManualMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendManual()}
                    placeholder="Escribir mensaje manual..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                  <button
                    onClick={sendManual}
                    disabled={sending || !manualMessage.trim()}
                    className="p-2.5 bg-mint text-white rounded-xl hover:bg-mint-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>

              {/* ── Col 3: Panel cliente + citas ── */}
              <div className={`w-full lg:w-72 xl:w-80 bg-white border-l border-slate-100 flex flex-col overflow-y-auto shrink-0 ${
                showPanel ? "flex" : "hidden lg:flex"
              }`}>
                {/* Client info */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${
                      owner ? "bg-mint/10 text-mint" : "bg-slate-100 text-slate-400"
                    }`}>
                      {owner ? owner.name[0].toUpperCase() : <User size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-ink text-sm truncate">{owner?.name ?? "Cliente nuevo"}</p>
                      <p className="text-xs text-slate-400 font-mono">{selectedPhone}</p>
                    </div>
                  </div>
                  {owner ? (
                    <Link
                      href={`/clientes`}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-mint border border-mint/30 rounded-xl py-2 hover:bg-mint/5 transition-colors"
                    >
                      Ver perfil <ChevronRight size={13} />
                    </Link>
                  ) : (
                    <div className="bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-400 font-medium text-center">
                      Cliente no registrado
                    </div>
                  )}
                  {owner?.notes && (
                    <p className="mt-2 text-xs text-slate-500 bg-sand/10 rounded-xl px-3 py-2">{owner.notes}</p>
                  )}
                </div>

                {/* Citas section */}
                <div className="p-4 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Citas</h3>
                    {owner && (
                      <Link
                        href="/agenda"
                        className="flex items-center gap-1 text-[11px] font-bold text-mint hover:text-mint-dark transition-colors"
                      >
                        <Plus size={12} /> Nueva
                      </Link>
                    )}
                  </div>

                  {!owner ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      Registra al cliente para ver sus citas
                    </p>
                  ) : appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarDays size={28} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-xs text-slate-400 font-medium">Sin citas registradas</p>
                      <Link href="/agenda" className="text-xs font-bold text-mint hover:text-mint-dark mt-2 inline-block">
                        + Agendar cita
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Próximas */}
                      {upcomingAppts.length > 0 && (
                        <>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Próximas</p>
                          {upcomingAppts.map(appt => (
                            <AppointmentCard key={appt.id} appt={appt} />
                          ))}
                        </>
                      )}
                      {/* Historial */}
                      {pastAppts.length > 0 && (
                        <>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-3 mb-1.5">Historial</p>
                          {pastAppts.slice(0, 4).map(appt => (
                            <AppointmentCard key={appt.id} appt={appt} />
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Appointment card ─────────────────────────────────────────
function AppointmentCard({ appt }: { appt: Appointment }) {
  const st = APPT_STATUS[appt.status] ?? { label: appt.status, color: "bg-slate-100 text-slate-500" };
  return (
    <div className="bg-slate-50 rounded-xl p-3 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${st.color}`}>
          {st.label}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {format(new Date(appt.scheduled_at), "d MMM HH:mm", { locale: es })}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <PawPrint size={11} className="text-slate-400 shrink-0" />
        <p className="text-xs font-semibold text-ink truncate">{appt.pets?.name ?? "Mascota"}</p>
        <span className="text-slate-300 text-xs">·</span>
        <p className="text-xs text-slate-400 truncate capitalize">{appt.type.replace("_", " ")}</p>
      </div>
    </div>
  );
}
