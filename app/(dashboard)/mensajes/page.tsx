"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Save, Loader2, Info, Sparkles } from "lucide-react";

interface MessageTemplate {
    id: string;
    type: string;
    body: string;
    is_active: boolean;
}

const TEMPLATE_INFO = {
    reminder: { icon: "R", title: "Recordatorio 24h", desc: "Se envia un dia antes de la cita programada." },
    winback: { icon: "W", title: "Recuperacion (30 dias)", desc: "Se envia si la mascota no ha venido en 1 mes." },
    birthday: { icon: "C", title: "Cumpleanos", desc: "Felicitacion el dia de su cumpleanos." },
    custom: { icon: "M", title: "Personalizada (Manual)", desc: "Plantilla 100% libre para envios manuales desde el Outbox." }
};

const MAGIC_VARIABLES = [
    { label: "Cliente", tag: "{owner_name}" },
    { label: "Mascota", tag: "{pet_name}" },
    { label: "Fecha", tag: "{date}" },
    { label: "Hora", tag: "{time}" },
    { label: "Clínica", tag: "{clinic_name}" },
];

export default function MensajesPage() {
    const supabase = createClient();
    const [templates, setTemplates] = useState<Record<string, MessageTemplate>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchTemplates = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const tenant_id = session?.user.app_metadata?.tenant_id || session?.user.user_metadata?.tenant_id;

        if (!tenant_id) {
            setLoading(false);
            return;
        }

        const { data } = await supabase
            .from("message_templates")
            .select("*")
            .eq("tenant_id", tenant_id);

        if (data) {
            const map: Record<string, MessageTemplate> = {};
            data.forEach((t: any) => map[t.type] = {
                id: t.id,
                type: t.type,
                body: t.body,
                is_active: t.is_active
            });
            setTemplates(map);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const insertVariable = (type: string, variable: string) => {
        const temp = templates[type];
        if (!temp || !temp.is_active) return;

        const textarea = document.getElementById(`textarea-${type}`) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = temp.body || "";

        const newText = currentText.substring(0, start) + variable + currentText.substring(end);

        setTemplates(prev => ({
            ...prev,
            [type]: { ...temp, body: newText }
        }));

        // Restore focus and cursor position after React re-renders
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    const handleSave = async (type: string) => {
        setSaving(true);
        const template = templates[type];

        if (template) {
            const { data: { session } } = await supabase.auth.getSession();
            // Intentamos obtener tenant_id de app_metadata o user_metadata
            const tenant_id = session?.user.app_metadata?.tenant_id || session?.user.user_metadata?.tenant_id;

            if (!tenant_id) {
                alert("No se pudo identificar tu veterinaria. Por favor, re-ingresa.");
                setSaving(false);
                return;
            }

            const payload: any = {
                tenant_id,
                type: template.type,
                body: template.body,
                is_active: template.is_active,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase.from("message_templates").upsert(payload, { onConflict: "tenant_id,type" });

            if (error) {
                console.error("Error saving template:", error);
                alert("Error al guardar: " + error.message);
            } else {
                // Actualizar estado local para asegurar que tenemos el ID si era nuevo
                await fetchTemplates();
                alert("✅ Plantilla guardada y activada correctamente.");
            }
        }
        setSaving(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto pb-24 md:pb-6 space-y-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Configuración de WhatsApp
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                        Define los textos que Ladrido enviará por ti.
                    </p>
                </div>
                <Link
                    href="/mensajes/outbox"
                    className="flex items-center gap-2 bg-teal-50 text-teal-600 px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-teal-500 hover:text-white transition-all shadow-sm shadow-teal-100/50 hover:shadow-md hover:-translate-y-0.5"
                >
                    <MessageSquare size={18} />
                    Ver seguimiento (Outbox)
                </Link>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 backdrop-blur-sm border border-blue-100/50 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 text-sm text-blue-800/80 items-start shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2.5 bg-blue-100 rounded-xl shrink-0">
                    <Sparkles size={22} className="text-blue-500" />
                </div>
                <div className="space-y-2 pt-1">
                    <p className="font-bold text-blue-900 text-base">Variables Dinámicas Mágicas</p>
                    <p className="font-medium leading-relaxed max-w-2xl">
                        Haz clic en los botones debajo de cada campo de texto para insertar automáticamente etiquetas especiales. Ladrido las reemplazará automáticamente con la información real del cliente al momento de enviar el mensaje.
                    </p>
                    <div className="flex gap-2 flex-wrap pt-1">
                        {MAGIC_VARIABLES.map(v => (
                            <span key={v.tag} className="bg-white text-blue-700 px-2.5 py-1 rounded-lg shadow-sm border border-blue-100/50 text-xs font-bold font-mono">
                                {v.tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid sm:grid-cols-2 gap-5">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-[280px] bg-slate-100 rounded-[1.5rem] animate-pulse" />)}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                    {Object.entries(TEMPLATE_INFO).map(([type, info]) => {
                        const temp = templates[type] || { id: "", type, body: "", is_active: false };

                        return (
                            <div key={type} className={`bg-white/90 backdrop-blur-xl border-2 rounded-[2rem] p-6 transition-all duration-300 relative overflow-hidden group ${temp.is_active ? 'border-teal-400 shadow-xl shadow-teal-500/10 -translate-y-1' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
                                {temp.is_active && (
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-teal-400/10 rounded-bl-[6rem] -z-10 blur-2xl" />
                                )}

                                <div className="flex items-start justify-between mb-5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transform -rotate-3 transition-all duration-500 ${temp.is_active ? 'bg-teal-500 text-white font-black scale-110 rotate-0' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}>
                                            {info.icon}
                                        </div>
                                        <div>
                                            <h3 className={`font-black text-lg transition-colors ${temp.is_active ? 'text-teal-900' : 'text-slate-900'}`}>{info.title}</h3>
                                            <p className="text-slate-500 font-medium text-xs mt-0.5 max-w-[180px] leading-snug">{info.desc}</p>
                                        </div>
                                    </div>
                                    <label className="flex items-center cursor-pointer pt-2 shrink-0">
                                        <div className="relative shadow-sm rounded-full">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={temp.is_active}
                                                onChange={(e) => setTemplates(prev => ({
                                                    ...prev,
                                                    [type]: { ...temp, is_active: e.target.checked }
                                                }))}
                                            />
                                            <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${temp.is_active ? 'bg-teal-500' : 'bg-slate-200'}`}></div>
                                            <div className={`dot absolute left-[3px] top-[3px] bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${temp.is_active ? 'translate-x-[20px]' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>

                                <div className="relative mt-4">
                                    <textarea
                                        id={`textarea-${type}`}
                                        value={temp.body}
                                        onChange={(e) => setTemplates(prev => ({
                                            ...prev,
                                            [type]: { ...temp, body: e.target.value }
                                        }))}
                                        className={`w-full text-[15px] font-medium leading-relaxed h-36 p-4 border-2 rounded-2xl outline-none resize-none transition-all ${temp.is_active ? 'border-teal-100 bg-white focus:ring-4 focus:ring-teal-500/20 focus:border-teal-400 shadow-inner' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                                        placeholder={`Escribe aquí tu mensaje de ${info.title.toLowerCase()}...`}
                                        disabled={!temp.is_active}
                                    />

                                    {temp.is_active && (
                                        <div className="flex gap-2 flex-wrap mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {MAGIC_VARIABLES.map(variable => (
                                                <button
                                                    key={variable.tag}
                                                    onClick={() => insertVariable(type, variable.tag)}
                                                    className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-indigo-100/50 hover:border-indigo-200 focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                                    title={`Insertar ${variable.tag}`}
                                                >
                                                    <Sparkles size={12} className="text-indigo-400" />
                                                    {variable.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {!temp.is_active && (
                                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl backdrop-blur-[2px]">
                                            <span className="bg-slate-900 text-white text-xs px-4 py-2 rounded-full font-bold shadow-soft-purple">Automatización Inactiva</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={() => handleSave(type)}
                                        disabled={saving}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm w-full justify-center sm:w-auto ${saving
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-900 text-white hover:bg-teal-500 hover:shadow-md hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Guardar plantilla
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
