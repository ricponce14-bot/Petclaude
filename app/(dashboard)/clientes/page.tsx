"use client";
// app/(dashboard)/clientes/page.tsx
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Plus, Phone, Users } from "lucide-react";
import Link from "next/link";
import NewOwnerModal from "@/components/crm/NewOwnerModal";
import type { Owner } from "@/lib/supabase/types";

export default function ClientesPage() {
  const supabase = createClient();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchOwners = async () => {
    setLoading(true);
    const query = supabase
      .from("owners")
      .select("*, pets(id, name, breed)")
      .order("name");

    if (search) query.ilike("name", `%${search}%`);
    const { data } = await query;
    setOwners((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchOwners(); }, [search]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header Premium */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Directorio</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {owners.length} clientes registrados
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-soft-purple hover:bg-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl"
        >
          <Plus size={18} /> Nuevo cliente
        </button>
      </div>

      {/* Search Premium */}
      <div className="relative group">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cliente por nombre..."
          className="w-full pl-11 pr-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all placeholder:text-slate-400 text-slate-800"
        />
      </div>

      {/* List Premium */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : owners.length === 0 ? (
        <div className="text-center py-20 glass rounded-[2rem]">
          <Users size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold text-lg">No hay clientes todavía</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-teal-600 font-bold hover:text-teal-500 transition-colors">
            + Registrar el primero
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {owners.map((owner: any) => (
            <Link
              key={owner.id}
              href={`/clientes/${owner.id}`}
              className="group flex flex-col bg-white/80 backdrop-blur-md rounded-[1.5rem] border border-slate-100 shadow-sm p-5 hover:shadow-soft-teal hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-teal-50 rounded-bl-full opacity-50 transition-transform group-hover:scale-110 -z-10" />

              <div className="flex items-center gap-4 mb-3">
                {/* Avatar inicial orgánico */}
                <div className="w-12 h-12 rounded-2xl bg-teal-100/50 text-teal-600 flex items-center justify-center font-black text-lg shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform">
                  {owner.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-base truncate pr-6">{owner.name}</p>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <Phone size={12} className="text-teal-500" /> {owner.whatsapp}
                  </p>
                </div>
              </div>

              <div className="flex gap-1.5 flex-wrap mt-auto pt-3 border-t border-slate-100/50">
                {owner.pets?.length === 0 && <span className="text-xs text-slate-400 font-medium italic">Sin mascotas</span>}
                {owner.pets?.map((pet: any) => (
                  <span key={pet.id} className="text-[11px] font-bold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full shadow-sm">
                    {pet.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <NewOwnerModal onClose={() => setShowModal(false)} onCreated={fetchOwners} />
      )}
    </div>
  );
}
