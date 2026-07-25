"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Plus, Phone, Users } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import NewOwnerModal from "@/components/crm/NewOwnerModal";
import type { Owner } from "@/lib/supabase/types";

const AVATAR_COLORS = [
  { bg: "bg-orange-100",  text: "text-[#E8542F]" },
  { bg: "bg-[#E9F3EE]",  text: "text-[#0E8C6D]" },
  { bg: "bg-[#FAEFE5]",  text: "text-[#E8542F]" },
];

export default function ClientesPage() {
  const supabase = createClient();
  const [owners, setOwners]     = useState<Owner[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchOwners = async () => {
    setLoading(true);
    const query = supabase.from("owners").select("*").order("name");
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
          <h1 className="text-2xl md:text-3xl font-black text-[#241C15] tracking-tight">Directorio</h1>
          <p className="text-sm text-[#8B7A6A] font-medium mt-0.5">
            {owners.length} clientes registrados
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#E8542F] text-white
                     px-5 py-2.5 rounded-[20px] text-sm font-bold
                     shadow-[0_8px_24px_rgba(232,84,47,0.30)]
                     hover:bg-[#C73E1D] transition-colors"
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
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B3A18D]
                                     pointer-events-none transition-colors" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cliente por nombre..."
          className="w-full pl-11 pr-5 py-3.5 bg-[#F7ECDD] border border-[#EADDC8]
                     rounded-[20px] text-sm font-medium text-[#241C15]
                     placeholder:text-[#B3A18D] outline-none
                     focus:border-[#E8542F] focus:ring-4 focus:ring-orange-100 focus:bg-white
                     transition-all duration-200"
        />
      </motion.div>

      {/* ── Lista ──────────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 rounded-[32px] bg-[#F7ECDD] animate-pulse" />
          ))}
        </div>
      ) : owners.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 rounded-[32px] bg-white border border-[#EADDC8]"
        >
          <div className="inline-flex w-16 h-16 rounded-[20px] bg-[#FAEFE5] items-center justify-center mb-4">
            <Users size={28} className="text-[#E8542F]" />
          </div>
          <p className="text-[#8B7A6A] font-bold text-base mb-2">No hay clientes todavía</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm font-bold text-[#E8542F] hover:text-[#C73E1D] transition-colors"
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
                               border border-[#EADDC8]
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
                        <p className="font-bold text-[#241C15] text-base truncate">{owner.name}</p>
                        <p className="text-xs text-[#8B7A6A] font-medium flex items-center gap-1.5 mt-0.5">
                          <Phone size={11} className="text-[#E8542F]" />
                          {owner.whatsapp}
                        </p>
                      </div>
                    </div>

                    {/* Notas / CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#EADDC8]">
                      <span className="text-xs text-[#8B7A6A] font-medium truncate max-w-[70%]">
                        {owner.notes ? owner.notes : "Sin notas"}
                      </span>
                      <span className="text-[11px] font-bold text-[#E8542F]">Ver historial →</span>
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
