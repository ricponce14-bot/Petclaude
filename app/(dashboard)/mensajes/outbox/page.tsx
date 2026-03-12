"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Clock, Send, XCircle, CheckCircle2, RotateCw, AlertTriangle, MessageSquare, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import SendMessageModal from "@/components/mensajes/SendMessageModal";

type TabType = "pending" | "sent" | "failed";

export default function OutboxPage() {
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<TabType>("pending");
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [showSendModal, setShowSendModal] = useState(false);

    const fetchMessages = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("wa_messages")
            .select(`
                *,
                owners(name, whatsapp),
                pets(name)
            `)
            .eq("status", activeTab)
            .order("created_at", { ascending: activeTab === "pending" });

        setMessages(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchMessages();
    }, [activeTab]);

    const handleForceSend = async (id: string) => {
        setProcessingId(id);

        try {
            const res = await fetch('/api/whatsapp/process-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId: id })
            });

            if (res.ok) {
                fetchMessages();
            } else {
                alert("Hubo un error al intentar enviar el mensaje.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este mensaje de la cola?")) return;
        
        setProcessingId(id);
        const { error } = await supabase.from("wa_messages").delete().eq("id", id);
        
        if (error) {
            alert("Error al eliminar: " + error.message);
        } else {
            fetchMessages();
        }
        setProcessingId(null);
    };

    const TABS = [
        { id: "pending", label: "En Cola", icon: Clock },
        { id: "sent", label: "Enviados", icon: CheckCircle2 },
        { id: "failed", label: "Fallidos", icon: XCircle },
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto pb-24 md:pb-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Send className="text-teal-600" size={32} /> Seguimiento
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                        Monitorea en tiempo real los mensajes enviados por Ladrido.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSendModal(true)}
                        className="flex items-center gap-2 bg-teal-500 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-teal-600 hover:shadow-lg transition-all hover:-translate-y-0.5 shadow-sm"
                    >
                        <Plus size={16} /> Enviar nuevo mensaje
                    </button>
                    <Link
                        href="/mensajes"
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-sm transition-colors"
                    >
                        <RotateCw size={16} /> Plantillas
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">En Cola</p>
                    <p className="text-2xl font-black text-amber-500">{activeTab === "pending" ? messages.length : "—"}</p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Enviados</p>
                    <p className="text-2xl font-black text-teal-500">{activeTab === "sent" ? messages.length : "—"}</p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Fallidos</p>
                    <p className="text-2xl font-black text-red-500">{activeTab === "failed" ? messages.length : "—"}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-slate-100/50 backdrop-blur-md rounded-[1.5rem] w-fit border border-slate-200/50">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isActive
                                ? "bg-white text-slate-900 shadow-sm transform scale-105"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                }`}
                        >
                            <Icon size={16} className={isActive ? "text-teal-500" : ""} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Message List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[1.5rem] animate-pulse" />)}
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center py-24 glass rounded-[2rem]">
                    <p className="text-5xl mb-4">📭</p>
                    <p className="text-slate-500 font-bold text-lg">No hay mensajes {activeTab === "pending" ? "en cola" : activeTab === "sent" ? "enviados" : "fallidos"}</p>
                    {activeTab === "pending" && <p className="text-sm text-slate-400 mt-2">Los mensajes se preparan automáticamente todos los días.</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[1.5rem] p-5 shadow-sm hover:shadow-soft-teal hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">

                            <div className="flex flex-col sm:flex-row gap-5">
                                {/* Status Icon Area */}
                                <div className="hidden sm:flex flex-col items-center justify-center w-16 shrink-0 border-r border-slate-100/50">
                                    {activeTab === "pending" && <Clock className="text-amber-500" size={28} />}
                                    {activeTab === "sent" && <CheckCircle2 className="text-green-500" size={28} />}
                                    {activeTab === "failed" && <XCircle className="text-red-500" size={28} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-slate-900 text-lg">{msg.owners?.name || "Cliente"}</span>
                                            <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                                                {msg.phone || msg.owners?.whatsapp || "Sin número"}
                                            </span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-400">
                                            {format(new Date(msg.created_at), "d MMMM yyyy, HH:mm", { locale: es })}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-sm ${msg.type === "reminder" ? "bg-blue-100 text-blue-700" :
                                            msg.type === "winback" ? "bg-purple-100 text-purple-700" :
                                                msg.type === "birthday" ? "bg-pink-100 text-pink-700" :
                                                    "bg-indigo-100 text-indigo-700"
                                            }`}>
                                            {msg.type}
                                        </span>
                                        {msg.pets && (
                                            <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-sm font-bold">
                                                {msg.pets.name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl relative">
                                        <div className="absolute top-0 right-0 p-2">
                                            <MessageSquare size={14} className="text-slate-300" />
                                        </div>
                                        <p className="text-slate-600 text-sm whitespace-pre-wrap font-medium">{msg.body}</p>
                                    </div>

                                    {msg.error && (
                                        <div className="mt-3 bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold flex gap-2 items-start border border-red-100">
                                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                            <span className="break-all">{msg.error}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                {(activeTab === "pending" || activeTab === "failed" || activeTab === "sent") && (
                                    <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100/50 pt-4 sm:pt-0 sm:pl-5">
                                        <button
                                            onClick={() => handleForceSend(msg.id)}
                                            disabled={processingId === msg.id}
                                            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50"
                                        >
                                            {processingId === msg.id ? (
                                                <RotateCw className="animate-spin" size={16} />
                                            ) : (
                                                <Send size={16} />
                                            )}
                                            {activeTab === "sent" ? "Volver a enviar" : activeTab === "failed" ? "Reintentar" : "Enviar ahora"}
                                        </button>
                                        
                                        <button
                                            onClick={() => handleDelete(msg.id)}
                                            disabled={processingId === msg.id}
                                            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50"
                                        >
                                            <XCircle size={16} />
                                            Borrar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showSendModal && (
                <SendMessageModal
                    onClose={() => setShowSendModal(false)}
                    onSent={() => {
                        setActiveTab("pending");
                        fetchMessages();
                    }}
                />
            )}
        </div>
    );
}
