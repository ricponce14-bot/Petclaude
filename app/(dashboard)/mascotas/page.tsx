"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Plus, User, Info } from "lucide-react";
import Link from "next/link";
import type { Pet } from "@/lib/supabase/types";

export default function MascotasPage() {
    const supabase = createClient();
    const [pets, setPets] = useState<Pet[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchPets = async () => {
        setLoading(true);
        // Fetch las mascotas junto con el nombre del dueño
        const query = supabase
            .from("pets")
            .select("*, owner:owners(id, name, whatsapp)")
            .order("name");

        if (search) query.ilike("name", `%${search}%`);
        const { data } = await query;
        setPets((data as any[]) ?? []);
        setLoading(false);
    };

    useEffect(() => {
        fetchPets();
    }, [search]);

    // Función para renderizar el emoji de especie
    const getSpeciesEmoji = (species: string) => {
        switch (species) {
            case "dog": return "🐶";
            case "cat": return "🐱";
            default: return "🐾";
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 pb-24 md:pb-6">
            {/* Header Premium */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mascotas</h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                        {pets.length} pacientes registrados
                    </p>
                </div>
                <Link
                    href="/clientes" // Para agregar mascota, lo mandamos a clientes
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-soft-purple hover:bg-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                    <Plus size={18} /> Nueva mascota
                </Link>
            </div>

            {/* Explicación de flujo Premium */}
            <div className="bg-blue-50/50 backdrop-blur-sm border border-blue-100/50 rounded-3xl p-4 flex gap-4 text-sm text-blue-800/80 items-start shadow-sm">
                <div className="p-2 bg-blue-100 rounded-xl shrink-0">
                    <Info size={20} className="text-blue-500" />
                </div>
                <p className="font-medium pt-1">
                    Las mascotas siempre pertenecen a un dueño. Para crear una nueva, ve al <Link href="/clientes" className="font-bold underline text-blue-600 hover:text-blue-500">Directorio de Clientes</Link>.
                </p>
            </div>

            {/* Buscador Premium */}
            <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar paciente por nombre..."
                    className="w-full pl-11 pr-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all placeholder:text-slate-400 text-slate-800"
                />
            </div>

            {/* Lista de Mascotas Premium */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-[1.5rem] animate-pulse" />)}
                </div>
            ) : pets.length === 0 ? (
                <div className="text-center py-20 glass rounded-[2rem]">
                    <p className="text-5xl mb-4">🪹</p>
                    <p className="text-slate-500 font-bold text-lg">No se encontraron mascotas</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {pets.map((pet: any) => (
                        <Link
                            key={pet.id}
                            href={`/mascotas/${pet.id}`}
                            className="group flex items-start gap-4 bg-white/80 backdrop-blur-md rounded-[1.5rem] border border-slate-100 shadow-sm p-5 hover:shadow-soft-teal hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 rounded-bl-full opacity-50 transition-transform group-hover:scale-110 -z-10" />

                            {/* Avatar Orgánico */}
                            <div className="w-16 h-16 rounded-2xl bg-orange-100/50 text-orange-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 overflow-hidden shadow-sm">
                                {pet.photo_url ? (
                                    <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                                ) : (
                                    getSpeciesEmoji(pet.species)
                                )}
                            </div>

                            <div className="flex-1 min-w-0 py-1">
                                <h3 className="font-black text-slate-900 text-lg truncate mb-0.5">{pet.name}</h3>
                                <p className="text-sm font-semibold text-slate-500 truncate mb-3">
                                    {pet.breed || "Raza mixta"}
                                </p>

                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 w-fit px-2.5 py-1.5 rounded-lg">
                                    <User size={14} className="text-slate-400" />
                                    <span className="truncate max-w-[120px]">{pet.owner?.name || "Sin dueño"}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
