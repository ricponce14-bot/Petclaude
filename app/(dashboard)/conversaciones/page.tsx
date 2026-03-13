"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MessageCircle, Send, ArrowLeft, Bot, User, Clock,
  CheckCircle2, XCircle, RefreshCw, Search, Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import NewMessageModal from "@/components/conversaciones/NewMessageModal";
import { Paperclip, Image as ImageIcon, Smile } from "lucide-react";

interface Conversation {
  phone: string;
  last_message: string;
  last_time: string;
  direction: string;
  message_count: number;
  owner_name?: string;
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

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  inicio: { label: "Menú", color: "bg-slate-100 text-slate-600" },
  seleccionar_servicio: { label: "Eligiendo servicio", color: "bg-blue-100 text-blue-700" },
  seleccionar_fecha: { label: "Eligiendo fecha", color: "bg-blue-100 text-blue-700" },
  seleccionar_hora: { label: "Eligiendo hora", color: "bg-blue-100 text-blue-700" },
  confirmar: { label: "Por confirmar", color: "bg-amber-100 text-amber-700" },
  esperando_confirmacion: { label: "Esperando confirmación", color: "bg-purple-100 text-purple-700" },
  reagendar_seleccionar: { label: "Reagendando", color: "bg-orange-100 text-orange-700" },
  reagendar_fecha: { label: "Reagendando", color: "bg-orange-100 text-orange-700" },
  reagendar_hora: { label: "Reagendando", color: "bg-orange-100 text-orange-700" },
  finalizado: { label: "Finalizado", color: "bg-green-100 text-green-700" },
};

export default function ConversacionesPage() {
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [manualMessage, setManualMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations (grouped by phone)
  const fetchConversations = async () => {
    // Get unique phones with their latest message from wa_messages
    const { data: msgs } = await supabase
      .from("wa_messages")
      .select("phone, body, direction, created_at, type")
      .in("type", ["bot_reply", "bot_incoming", "manual"])
      .order("created_at", { ascending: false })
      .limit(500);

    if (!msgs) {
      setLoading(false);
      return;
    }

    // Group by phone
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

    // Try to match phones with owner names
    const phones = Array.from(phoneMap.keys());
    if (phones.length > 0) {
      const { data: owners } = await supabase
        .from("owners")
        .select("name, whatsapp")
        .in("whatsapp", phones);

      if (owners) {
        for (const owner of owners as any[]) {
          const conv = phoneMap.get(owner.whatsapp);
          if (conv) conv.owner_name = owner.name;
        }
      }
    }

    // Get active chat sessions for state info
    const { data: sessions } = await supabase
      .from("whatsapp_chat_sessions")
      .select("phone, state")
      .in("phone", phones);

    if (sessions) {
      for (const session of sessions as any[]) {
        const conv = phoneMap.get(session.phone);
        if (conv) conv.state = session.state;
      }
    }

    const sorted = Array.from(phoneMap.values())
      .sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());

    setConversations(sorted);
    setLoading(false);
  };

  // Fetch messages for a specific phone
  const fetchMessages = async (phone: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from("wa_messages")
      .select("id, phone, body, direction, type, status, created_at")
      .eq("phone", phone)
      .in("type", ["bot_reply", "bot_incoming", "manual"])
      .order("created_at", { ascending: true })
      .limit(100);

    setMessages((data as Message[]) || []);
    setLoadingMessages(false);

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Send manual message
  const sendManual = async () => {
    if (!manualMessage.trim() || !selectedPhone) return;
    setSending(true);

    try {
      // Find the owner_id for this phone
      const { data: owner } = await supabase
        .from("owners")
        .select("id")
        .eq("whatsapp", selectedPhone)
        .single();

      const res = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: (owner as any)?.id || null,
          body: manualMessage,
        }),
      });

      if (res.ok) {
        setManualMessage("");
        // Refresh messages after short delay
        setTimeout(() => fetchMessages(selectedPhone), 1500);
      } else {
        const err = await res.json();
        alert("Error al enviar: " + (err.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPhone) return;

    setUploading(true);
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedPhone}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (error) throw error;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      // 3. Send message with image URL
      const { data: owner } = await supabase
        .from("owners")
        .select("id")
        .eq("whatsapp", selectedPhone)
        .single();

      const res = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: (owner as any)?.id || null,
          media_url: publicUrl,
          body: "📷 Foto enviada",
        }),
      });

      if (res.ok) {
        setTimeout(() => fetchMessages(selectedPhone), 1500);
      } else {
        alert("Error al enviar imagen");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // Poll every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPhone) {
      fetchMessages(selectedPhone);
      // Poll messages every 5 seconds when viewing a conversation
      const interval = setInterval(() => fetchMessages(selectedPhone), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedPhone]);

  const filtered = conversations.filter(c =>
    !search || c.phone.includes(search) || c.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Mobile: show either list or chat
  const showChat = selectedPhone !== null;

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh)] flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar: Conversation List */}
      <div className={`w-full md:w-96 bg-white border-r border-slate-100 flex flex-col ${showChat ? "hidden md:flex" : "flex"}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-100">
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-3">
            <MessageCircle className="text-teal-500" size={24} />
            Conversaciones
          </h1>
          <button
            onClick={() => setShowNewMessageModal(true)}
            className="w-full mb-3 flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold shadow-soft-purple hover:bg-teal-500 transition-all active:scale-[0.98]"
          >
            <Send size={16} /> Nuevo mensaje
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-teal-500" size={24} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bot size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No hay conversaciones aún</p>
              <p className="text-xs mt-1">Las conversaciones del bot aparecerán aquí</p>
            </div>
          ) : (
            filtered.map(conv => (
              <button
                key={conv.phone}
                onClick={() => setSelectedPhone(conv.phone)}
                className={`w-full text-left px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                  selectedPhone === conv.phone ? "bg-teal-50 border-l-4 border-l-teal-500" : ""
                }`}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                  conv.owner_name ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"
                }`}>
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {conv.owner_name || conv.phone}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatDistanceToNow(new Date(conv.last_time), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  {conv.owner_name && (
                    <p className="text-[11px] text-slate-400 font-mono">{conv.phone}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-500 truncate flex-1">
                      {conv.direction === "inbound" ? "👤 " : "🤖 "}
                      {conv.last_message?.slice(0, 50)}
                    </p>
                    {conv.state && STATE_LABELS[conv.state] && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATE_LABELS[conv.state].color}`}>
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

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-slate-50 ${!showChat ? "hidden md:flex" : "flex"}`}>
        {!selectedPhone ? (
          <div className="flex-1 flex items-center justify-center text-slate-300">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-bold">Selecciona una conversación</p>
              <p className="text-sm mt-1">Elige un chat de la lista para ver el historial</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => setSelectedPhone(null)}
                className="md:hidden p-2 hover:bg-slate-50 rounded-xl"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                <User size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">
                  {conversations.find(c => c.phone === selectedPhone)?.owner_name || selectedPhone}
                </p>
                <p className="text-xs text-slate-400 font-mono">{selectedPhone}</p>
              </div>
              {(() => {
                const conv = conversations.find(c => c.phone === selectedPhone);
                const stateInfo = conv?.state ? STATE_LABELS[conv.state] : null;
                return stateInfo ? (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${stateInfo.color}`}>
                    {stateInfo.label}
                  </span>
                ) : null;
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="animate-spin text-teal-500" size={24} />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16 text-slate-300 text-sm">No hay mensajes</div>
              ) : (
                messages.map(msg => {
                  const isInbound = msg.direction === "inbound" || msg.type === "bot_incoming";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
                    >
                      <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        isInbound
                          ? "bg-white border border-slate-100 rounded-bl-md"
                          : msg.type === "manual"
                            ? "bg-indigo-500 text-white rounded-br-md"
                            : "bg-teal-500 text-white rounded-br-md"
                      }`}>
                        {/* Sender label */}
                        <div className={`flex items-center gap-1.5 mb-1 ${isInbound ? "text-slate-400" : "text-white/70"}`}>
                          {isInbound ? (
                            <><User size={12} /><span className="text-[10px] font-bold">Cliente</span></>
                          ) : msg.type === "manual" ? (
                            <><User size={12} /><span className="text-[10px] font-bold">Tú</span></>
                          ) : (
                            <><Bot size={12} /><span className="text-[10px] font-bold">Bot</span></>
                          )}
                        </div>
                        {/* Message body */}
                        {msg.body.startsWith("http") && (msg.body.includes(".jpg") || msg.body.includes(".png") || msg.body.includes(".jpeg") || msg.body.includes(".webp")) ? (
                          <div className="mb-2 rounded-lg overflow-hidden border border-black/5">
                            <img src={msg.body} alt="Adjunto" className="max-w-full h-auto" />
                          </div>
                        ) : (
                          <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                            isInbound ? "text-slate-800" : "text-white"
                          }`}>
                            {msg.body}
                          </p>
                        )}
                        {/* Time + status */}
                        <div className={`flex items-center gap-1 mt-1 ${isInbound ? "text-slate-300" : "text-white/60"}`}>
                          <Clock size={10} />
                          <span className="text-[10px]">
                            {format(new Date(msg.created_at), "d MMM h:mm a", { locale: es })}
                          </span>
                          {!isInbound && msg.status === "sent" && <CheckCircle2 size={10} />}
                          {!isInbound && msg.status === "failed" && <XCircle size={10} className="text-red-300" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Manual Message Input */}
            <div className="bg-white border-t border-slate-100 p-3 flex items-center gap-2 safe-area-bottom">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2.5 text-slate-400 hover:text-teal-500 hover:bg-teal-50 rounded-xl transition-all"
                title="Adjuntar foto"
              >
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
              </button>
              <input
                type="text"
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendManual()}
                placeholder="Escribe un mensaje manual..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
              />
              <button
                onClick={() => setManualMessage(prev => prev + "😊")}
                className="p-2 hidden sm:block text-slate-300 hover:text-amber-500 transition-colors"
              >
                <Smile size={20} />
              </button>
              <button
                onClick={sendManual}
                disabled={sending || (!manualMessage.trim() && !uploading)}
                className="p-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </>
        )}
      </div>

      {showNewMessageModal && (
        <NewMessageModal
          onClose={() => setShowNewMessageModal(false)}
          onSuccess={(phone) => {
            setSelectedPhone(phone);
            fetchConversations();
          }}
        />
      )}
    </div>
  );
}
