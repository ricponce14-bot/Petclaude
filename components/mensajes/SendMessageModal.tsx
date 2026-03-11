"use client";
import { useState, useEffect, useRef } from "react";
import { X, Loader2, Send, Search, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Owner {
    id: string;
    name: string;
    whatsapp: string;
}

interface Pet {
    id: string;
    name: string;
    owner_id: string;
}

interface SendMessageModalProps {
    onClose: () => void;
    onSent: () => void;
}

export default function SendMessageModal({ onClose, onSent }: SendMessageModalProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Owner search
    const [owners, setOwners] = useState<Owner[]>([]);
    const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // Pets for selected owner
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<string>("");

    // Message
    const [body, setBody] = useState("");

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchOwners = async () => {
            const { data } = await supabase.from("owners").select("id, name, whatsapp").order("name");
            setOwners((data as Owner[]) || []);
        };
        fetchOwners();
    }, []);

    useEffect(() => {
        if (searchTerm.length >= 1) {
            const filtered = owners.filter(o =>
                o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.whatsapp.includes(searchTerm)
            );
            setFilteredOwners(filtered);
            setShowDropdown(true);
        } else {
            setFilteredOwners([]);
            setShowDropdown(false);
        }
    }, [searchTerm, owners]);

    useEffect(() => {
        if (selectedOwner) {
            const fetchPets = async () => {
                const { data } = await supabase
                    .from("pets")
                    .select("id, name, owner_id")
                    .eq("owner_id", selectedOwner.id);
                setPets((data as Pet[]) || []);
            };
            fetchPets();
        } else {
            setPets([]);
            setSelectedPetId("");
        }
    }, [selectedOwner]);

    // Close dropdown on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selectOwner = (owner: Owner) => {
        setSelectedOwner(owner);
        setSearchTerm(owner.name);
        setShowDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOwner || !body.trim()) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/whatsapp/send-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    owner_id: selectedOwner.id,
                    pet_id: selectedPetId || null,
                    body: body.trim(),
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al enviar");
            }

            setSuccess(true);
            setTimeout(() => {
                onSent();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Send size={18} className="text-teal-500" /> Enviar mensaje
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm font-bold border border-green-100">
                            ✅ Mensaje agregado a la cola de envío
                        </div>
                    )}

                    {/* Owner Search */}
                    <div ref={dropdownRef} className="relative">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Cliente *</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    if (selectedOwner && e.target.value !== selectedOwner.name) {
                                        setSelectedOwner(null);
                                    }
                                }}
                                placeholder="Buscar por nombre o telefono..."
                                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white text-sm"
                            />
                        </div>

                        {showDropdown && filteredOwners.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                                {filteredOwners.map(owner => (
                                    <button
                                        key={owner.id}
                                        type="button"
                                        onClick={() => selectOwner(owner)}
                                        className="w-full text-left px-4 py-2.5 hover:bg-teal-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
                                    >
                                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                            <User size={14} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{owner.name}</p>
                                            <p className="text-[11px] text-slate-400 font-medium">{owner.whatsapp}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {showDropdown && searchTerm.length >= 1 && filteredOwners.length === 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center text-sm text-slate-400">
                                No se encontraron clientes
                            </div>
                        )}
                    </div>

                    {/* Pet Selector (optional) */}
                    {selectedOwner && pets.length > 0 && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Mascota (opcional)</label>
                            <select
                                value={selectedPetId}
                                onChange={e => setSelectedPetId(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white text-sm"
                            >
                                <option value="">Sin mascota específica</option>
                                {pets.map(p => (
                                    <option key={p.id} value={p.id}>🐾 {p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Message Body */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Mensaje *</label>
                        <textarea
                            required
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            placeholder="Escribe tu mensaje aquí... Ej: Hola, te recordamos que tienes una promoción especial este mes."
                            rows={4}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white resize-none text-sm"
                        />
                        <p className="text-xs text-slate-400 mt-1 font-medium">{body.length} caracteres</p>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !selectedOwner || !body.trim() || success}
                            className="w-full flex justify-center items-center gap-2 bg-teal-500 text-white py-3 rounded-xl font-bold hover:bg-teal-600 transition-all disabled:opacity-60 shadow-sm"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : success ? (
                                "✅ Enviado"
                            ) : (
                                <>
                                    <Send size={16} /> Enviar a cola
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
