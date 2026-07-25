"use client";
// app/(dashboard)/clientes/[id]/page.tsx
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { notFound, useParams } from "next/navigation";
import { Phone, Mail, MapPin, CalendarDays, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import EditOwnerModal from "@/components/crm/EditOwnerModal";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Agendada",   cls: "bg-orange-50 text-[#E8542F]" },
  confirmed: { label: "Confirmada", cls: "bg-teal-50 text-[#0E8C6D]" },
  completed: { label: "Completada", cls: "bg-slate-100 text-slate-500" },
  cancelled: { label: "Cancelada",  cls: "bg-red-50 text-red-500" },
  no_show:   { label: "No asistió", cls: "bg-red-50 text-red-400" },
};

export default function ClienteDetailPage() {
    const { id } = useParams();
    const supabase = createClient();
    const [owner, setOwner] = useState<any>(null);
    const [appts, setAppts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();

    const fetchOwner = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("owners")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
            setLoading(false);
            return;
        }
        setOwner(data);

        // Historial de citas del cliente (por owner_id).
        const { data: apptData } = await supabase
            .from("appointments")
            .select("*")
            .eq("owner_id", id)
            .order("scheduled_at", { ascending: false })
            .limit(50);
        setAppts(apptData ?? []);
        setLoading(false);
    };

    useEffect(() => {
        fetchOwner();
    }, [id, supabase]);

    const handleDelete = async () => {
        if (!confirm(`¿Eliminar permanentemente a ${owner.name}? Esta acción también borrará su historial de citas.`)) return;

        setDeleting(true);
        const { error } = await supabase.from("owners").delete().eq("id", owner.id);

        if (error) {
            alert("Error al eliminar cliente: " + error.message);
            setDeleting(false);
        } else {
            router.push("/clientes");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-teal-500" size={40} />
            </div>
        );
    }

    if (!owner) return notFound();

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link
                href="/clientes"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors mb-2"
            >
                <ArrowLeft size={16} /> Volver al directorio
            </Link>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Client Info Card */}
                <div className="flex-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-10" />

                        <div className="flex items-start justify-between mb-8">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] bg-teal-500 text-white flex shrink-0 items-center justify-center text-3xl font-black shadow-lg shadow-teal-100 transform -rotate-3">
                                    {owner.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{owner.name}</h1>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Cliente desde {new Date(owner.created_at).getFullYear()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm border border-red-100 disabled:opacity-50"
                                >
                                    {deleting ? 'Borrando...' : 'Eliminar'}
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <Phone size={18} className="text-teal-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">WhatsApp</p>
                                    <p className="text-sm font-bold text-slate-800 mt-1">{owner.whatsapp}</p>
                                </div>
                            </div>

                            {owner.email && (
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <Mail size={18} className="text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Email</p>
                                        <p className="text-sm font-bold text-slate-800 mt-1">{owner.email}</p>
                                    </div>
                                </div>
                            )}

                            {owner.address && (
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <MapPin size={18} className="text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Dirección</p>
                                        <p className="text-sm font-bold text-slate-800 mt-1">{owner.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {owner.notes && (
                        <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6">
                            <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-3">Notas Internas</h3>
                            <p className="text-amber-900/70 text-sm font-medium leading-relaxed italic">
                                "{owner.notes}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Historial de citas */}
                <div className="w-full md:w-80 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <CalendarDays className="text-[#E8542F]" size={22} /> Historial
                        </h2>
                        <span className="bg-orange-100 text-[#E8542F] text-xs font-black px-2.5 py-1 rounded-full">{appts.length}</span>
                    </div>

                    <div className="grid gap-3">
                        {appts.length === 0 ? (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] p-8 text-center">
                                <p className="text-slate-400 text-sm font-bold">Sin citas registradas</p>
                            </div>
                        ) : (
                            appts.map((a: any) => {
                                const st = STATUS_LABEL[a.status] ?? STATUS_LABEL.scheduled;
                                return (
                                    <div key={a.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-slate-900 text-sm truncate">{a.servicio || "Cita"}</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium capitalize">
                                            {format(new Date(a.scheduled_at), "EEE d MMM · HH:mm", { locale: es })}
                                            {a.price ? ` · $${a.price}` : ""}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {showEditModal && (
                <EditOwnerModal
                    owner={owner}
                    onClose={() => setShowEditModal(false)}
                    onUpdated={fetchOwner}
                />
            )}
        </div>
    );
}
