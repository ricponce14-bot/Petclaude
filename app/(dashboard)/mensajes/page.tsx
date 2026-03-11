"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Save, Loader2, Info } from "lucide-react";

interface MessageTemplate {
    id: string;
    type: string;
    body: string;
    is_active: boolean;
}

const TEMPLATE_INFO = {
    reminder: { icon: "⏰", title: "Recordatorio 24h", desc: "Se envía un día antes de la cita programada." },
    winback: { icon: "🔄", title: "Recuperación (30 días)", desc: "Se envía si la mascota no ha venido en 1 mes." },
    birthday: { icon: "🎂", title: "Cumpleaños", desc: "Felicitación el día de su cumpleaños." },
    custom: { icon: "✍️", title: "Personalizada (Manual)", desc: "Plantilla 100% libre para envíos manuales desde el Outbox." }
};

export default function MensajesPage() {
    const supabase = createClient();
    const [templates, setTemplates] = useState<Record<string, MessageTemplate>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchTemplates = async () => {
        setLoading(true);
        const { data } = await supabase.from("message_templates").select("*");

        if (data) {
            const map: Record<string, MessageTemplate> = {};
            data.forEach((t: any) => map[t.type] = t);
            setTemplates(map);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

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
                // Notificar éxito al usuario
                const button = document.activeElement as HTMLButtonElement;
                if (button) {
                    const originalText = button.innerText;
                    button.innerText = "¡Guardado! ✅";
                    setTimeout(() => button.innerText = originalText, 2000);
                }
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

            <div className="bg-blue-50/50 backdrop-blur-sm border border-blue-100/50 rounded-3xl p-5 flex gap-4 text-sm text-blue-800/80 items-start shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2.5 bg-blue-100 rounded-xl shrink-0">
                    <Info size={22} className="text-blue-500" />
                </div>
                <div className="space-y-1.5 pt-1">
                    <p className="font-bold text-blue-900">Variables dinámicas mágicas:</p>
                    <p className="font-medium leading-relaxed">Puedes escribir palabras que Ladrido reemplazará automáticamente con la información real de tu cliente en el momento del envío. Ej: <code className="bg-white text-blue-700 px-2 py-1 rounded-lg shadow-sm border border-blue-100 text-xs font-bold leading-none mx-0.5">&#123;owner_name&#125;</code>, <code className="bg-white text-blue-700 px-2 py-1 rounded-lg shadow-sm border border-blue-100 text-xs font-bold leading-none mx-0.5">&#123;pet_name&#125;</code>, <code className="bg-white text-blue-700 px-2 py-1 rounded-lg shadow-sm border border-blue-100 text-xs font-bold leading-none mx-0.5">&#123;time&#125;</code>.</p>
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
                            <div key={type} className="bg-white/80 backdrop-blur-xl border text-sm border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-soft-teal hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-bl-[4rem] opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10 transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0" />

                                <div className="flex items-start justify-between mb-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm transform -rotate-3 group-hover:rotate-0 transition-transform">
                                            {info.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg">{info.title}</h3>
                                            <p className="text-slate-500 font-medium text-xs mt-0.5 max-w-[180px] leading-snug">{info.desc}</p>
                                        </div>
                                    </div>
                                    <label className="flex items-center cursor-pointer pt-2">
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

                                <div className="relative mt-2">
                                    <textarea
                                        value={temp.body}
                                        onChange={(e) => setTemplates(prev => ({
                                            ...prev,
                                            [type]: { ...temp, body: e.target.value }
                                        }))}
                                        className="w-full text-[15px] font-medium leading-relaxed h-32 p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none bg-slate-50 focus:bg-white text-slate-800 transition-all shadow-inner"
                                        placeholder={`Escribe aquí tu mensaje de ${info.title.toLowerCase()}...`}
                                        disabled={!temp.is_active}
                                    />
                                    {!temp.is_active && (
                                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl backdrop-blur-[2px]">
                                            <span className="bg-slate-900 text-white text-xs px-4 py-2 rounded-full font-bold shadow-soft-purple">Automatización Inactiva</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end mt-5">
                                    <button
                                        onClick={() => handleSave(type)}
                                        disabled={saving || !temp.is_active}
                                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-500 transition-all disabled:opacity-50 disabled:hover:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full justify-center sm:w-auto"
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
