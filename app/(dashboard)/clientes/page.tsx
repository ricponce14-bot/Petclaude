"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Plus, Phone, Users } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import NewOwnerModal from "@/components/crm/NewOwnerModal";
import type { Owner } from "@/lib/supabase/types";

const AVATAR_COLORS = [
  { bg: "bg-orange-100",  text: "text-[#FF8C42]" },
  { bg: "bg-[#E8F5F1]",  text: "text-[#4DA18A]" },
  { bg: "bg-[#FFF4EC]",  text: "text-[#FF8C42]" },
];

export default function ClientesPage() {
  const supabase = createClient();
  const [owners, setOwners]     = useState<Owner[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchOwners = async () => {
    setLoading(true);
    const query = supabase.from("owners").select("*, pets(id, name, breed)").order("name");
    if (search) query.ilike("name", `%${search}%`);
    const { data } = await query;
    setOwners((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchOwners(); }, [search]);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto space-y-5 pb-24 md:pb-8">

      {/* ── Header ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Directorio</h1>
          <p className="text-sm text-[#9e8a7a] font-medium mt-0.5">
            {owners.length} clientes registrados
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#FF8C42] text-white
                     px-5 py-2.5 rounded-[20px] text-sm font-bold
                     shadow-[0_8px_24px_rgba(255,140,66,0.30)]
                     hover:bg-[#E6722A] transition-colors"
        >
          <Plus size={17} strokeWidth={2.5} /> Nuevo cliente
        </motion.button>
      </motion.div>

      {/* ── Buscador ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.06 }}
        className="relative"
      >
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBA898]
                                     pointer-events-none transition-colors" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cliente por nombre..."
          className="w-full pl-11 pr-5 py-3.5 bg-[#FFF3E3] border border-[#F0E6D8]
                     rounded-[20px] text-sm font-medium text-[#1A1A1A]
                     placeholder:text-[#BBA898] outline-none
                     focus:border-[#FF8C42] focus:ring-4 focus:ring-orange-100 focus:bg-white
                     transition-all duration-200"
        />
      </motion.div>

      {/* ── Lista ──────────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 rounded-[32px] bg-[#FFF3E3] animate-pulse" />
          ))}
        </div>
      ) : owners.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 rounded-[32px] bg-white border border-[#F0E6D8]"
        >
          <div className="inline-flex w-16 h-16 rounded-[20px] bg-[#FFF4EC] items-center justify-center mb-4">
            <Users size={28} className="text-[#FF8C42]" />
          </div>
          <p className="text-[#9e8a7a] font-bold text-base mb-2">No hay clientes todavía</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm font-bold text-[#FF8C42] hover:text-[#E6722A] transition-colors"
          >
            + Registrar el primero
          </button>
        </motion.div>
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          <AnimatePresence>
            {owners.map((owner: any, i) => {
              const colorIdx = i % AVATAR_COLORS.length;
              const { bg, text } = AVATAR_COLORS[colorIdx];
              return (
                <motion.div
                  key={owner.id}
                  variants={{
                    hidden:  { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.36 } },
                  }}
                  whileHover={{ y: -5, boxShadow: "0 16px 48px rgba(0,0,0,0.10)" }}
                >
                  <Link
                    href={`/clientes/${owner.id}`}
                    className="flex flex-col bg-white rounded-[32px]
                               border border-[#F0E6D8]
                               shadow-[0_4px_32px_rgba(0,0,0,0.06)]
                               p-5 block transition-shadow duration-300"
                  >
                    {/* Top row */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-[18px] ${bg} ${text}
                                       flex items-center justify-center
                                       font-black text-xl shrink-0`}>
                        {owner.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1A1A1A] text-base truncate">{owner.name}</p>
                        <p className="text-xs text-[#9e8a7a] font-medium flex items-center gap-1.5 mt-0.5">
                          <Phone size={11} className="text-[#FF8C42]" />
                          {owner.whatsapp}
                        </p>
                      </div>
                    </div>

                    {/* Mascotas chips */}
                    <div className="flex gap-1.5 flex-wrap pt-3 border-t border-[#F0E6D8]">
                      {owner.pets?.length === 0 && (
                        <span className="text-xs text-[#BBA898] italic">Sin mascotas</span>
                      )}
                      {owner.pets?.map((pet: any) => (
                        <span
                          key={pet.id}
                          className="text-[11px] font-bold bg-[#E8F5F1] text-[#4DA18A]
                                     px-2.5 py-1 rounded-full"
                        >
                          {pet.name}
                        </span>
                      ))}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {showModal && (
        <NewOwnerModal onClose={() => setShowModal(false)} onCreated={fetchOwners} />
      )}
    </div>
  );
}
