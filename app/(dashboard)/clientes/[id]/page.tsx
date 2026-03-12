"use client";
// app/(dashboard)/clientes/[id]/page.tsx
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { notFound, useParams } from "next/navigation";
import { Phone, Mail, MapPin, PawPrint, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EditOwnerModal from "@/components/crm/EditOwnerModal";

export default function ClienteDetailPage() {
    const { id } = useParams();
    const supabase = createClient();
    const [owner, setOwner] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();

    const fetchOwner = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("owners")
            .select("*, pets(*)")
            .eq("id", id)
            .single();

        if (error || !data) {
            setLoading(false);
            return;
        }
        setOwner(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchOwner();
    }, [id, supabase]);

    const handleDelete = async () => {
        if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${owner.name}? Esta acción también borrará a sus mascotas y citas.`)) return;

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

                            {/* Action Menu */}
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

                {/* Pets List */}
                <div className="w-full md:w-80 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <PawPrint className="text-purple-500" size={24} /> Mascotas
                        </h2>
                        <span className="bg-purple-100 text-purple-600 text-xs font-black px-2.5 py-1 rounded-full">{owner.pets?.length || 0}</span>
                    </div>

                    <div className="grid gap-4">
                        {owner.pets?.length === 0 ? (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] p-8 text-center">
                                <p className="text-slate-400 text-sm font-bold">Sin mascotas registradas</p>
                            </div>
                        ) : (
                            owner.pets.map((pet: any) => (
                                <Link
                                    key={pet.id}
                                    href={`/mascotas/${pet.id}`}
                                    className="group block bg-white border border-slate-100 rounded-3xl p-4 shadow-sm hover:shadow-soft-purple hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-lg font-black text-purple-600 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                            {pet.species === 'cat' ? 'G' : 'P'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 leading-none">{pet.name}</h4>
                                            <p className="text-[11px] text-slate-500 font-medium mt-1 uppercase tracking-wider">{pet.breed || 'Mestizo'}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))
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
