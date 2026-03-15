"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Plus, User, PawPrint, Info } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Pet } from "@/lib/supabase/types";

const SPECIES_CONFIG: Record<string, { label: string; emoji: string; bg: string; text: string; border: string }> = {
  dog:   { label: "Perro", emoji: "",    bg: "bg-[#FFF4EC]", text: "text-[#FF8C42]", border: "border-orange-100" },
  cat:   { label: "Gato",  emoji: "",    bg: "bg-[#E8F5F1]",  text: "text-[#4DA18A]", border: "border-[#c8e6de]"   },
  other: { label: "Otro",  emoji: "",    bg: "bg-[#E8F5F1]",  text: "text-[#4DA18A]", border: "border-[#c8e6de]"   },
};

const TEMPERAMENT_BADGE: Record<string, { label: string; cls: string }> = {
  friendly:   { label: "Amigable",  cls: "bg-teal-50 text-[#00C4AA]" },
  nervous:    { label: "Nervioso",  cls: "bg-orange-50 text-[#FF8C42]" },
  aggressive: { label: "Agresivo",  cls: "bg-red-50 text-red-500" },
};

export default function MascotasPage() {
  const supabase = createClient();
  const [pets, setPets]       = useState<Pet[]>([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPets = async () => {
    setLoading(true);
    const query = supabase.from("pets").select("*, owner:owners(id, name, whatsapp)").order("name");
    if (search) query.ilike("name", `%${search}%`);
    const { data } = await query;
    setPets((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPets(); }, [search]);

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
          <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Mascotas</h1>
          <p className="text-sm text-[#9e8a7a] font-medium mt-0.5">
            {pets.length} pacientes registrados
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/clientes"
            className="flex items-center gap-2 bg-[#4DA18A] text-white
                       px-5 py-2.5 rounded-[20px] text-sm font-bold
                       shadow-[0_8px_24px_rgba(77,161,138,0.25)]
                       hover:bg-[#3d8a75] transition-colors"
          >
            <Plus size={17} strokeWidth={2.5} /> Nueva mascota
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Info callout ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.05 }}
        className="flex gap-3 items-start bg-[#E8F5F1] border border-[#c8e6de]
                   rounded-[24px] p-4 text-sm text-[#3d8a75]"
      >
        <div className="w-8 h-8 rounded-[12px] bg-[#d4ece6] flex items-center justify-center shrink-0">
          <Info size={16} className="text-[#4DA18A]" />
        </div>
        <p className="font-medium pt-0.5">
          Las mascotas pertenecen a un dueño. Para crear una nueva, ve al{" "}
          <Link href="/clientes" className="font-bold underline text-[#4DA18A] hover:text-[#3d8a75]">
            Directorio de Clientes
          </Link>.
        </p>
      </motion.div>

      {/* ── Buscador ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.08 }}
        className="relative"
      >
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBA898] pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar mascota por nombre..."
          className="w-full pl-11 pr-5 py-3.5 bg-[#FFF3E3] border border-[#F0E6D8]
                     rounded-[20px] text-sm font-medium text-[#1A1A1A]
                     placeholder:text-[#BBA898] outline-none
                     focus:border-[#4DA18A] focus:ring-4 focus:ring-[#b5d9ce] focus:bg-white
                     transition-all duration-200"
        />
      </motion.div>

      {/* ── Grid ───────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 rounded-[32px] bg-[#FFF3E3] animate-pulse" />
          ))}
        </div>
      ) : pets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 rounded-[32px] bg-white border border-[#F0E6D8]"
        >
          <div className="inline-flex w-16 h-16 rounded-[20px] bg-[#E8F5F1] items-center justify-center mb-4">
            <PawPrint size={28} className="text-[#4DA18A]" />
          </div>
          <p className="text-[#9e8a7a] font-bold text-base">No se encontraron mascotas</p>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          <AnimatePresence>
            {pets.map((pet: any) => {
              const sp = SPECIES_CONFIG[pet.species] ?? SPECIES_CONFIG.other;
              const temp = TEMPERAMENT_BADGE[pet.temperament];
              return (
                <motion.div
                  key={pet.id}
                  variants={{
                    hidden:  { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.36 } },
                  }}
                  whileHover={{ y: -5, boxShadow: "0 16px 48px rgba(0,0,0,0.10)" }}
                >
                  <Link
                    href={`/mascotas/${pet.id}`}
                    className={`flex items-start gap-4 ${sp.bg} border ${sp.border}
                                rounded-[32px] p-5 block
                                shadow-[0_4px_32px_rgba(0,0,0,0.04)]
                                transition-shadow duration-300`}
                  >
                    {/* Avatar especie */}
                    <div className={`w-14 h-14 rounded-[18px] bg-white ${sp.border} border
                                     flex items-center justify-center text-2xl shrink-0
                                     shadow-[0_2px_12px_rgba(0,0,0,0.06)]`}>
                      {pet.photo_url ? (
                        <img src={pet.photo_url} alt={pet.name}
                             className="w-full h-full object-cover rounded-[18px]" />
                      ) : sp.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`font-black text-lg truncate mb-0.5 ${sp.text}`}>
                        {pet.name}
                      </h3>
                      <p className="text-sm font-semibold text-[#9e8a7a] truncate mb-3">
                        {pet.breed || "Raza mixta"} · {sp.label}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#9e8a7a]
                                        bg-white border border-[#F0E6D8] px-2.5 py-1.5 rounded-[12px]">
                          <User size={13} />
                          <span className="truncate max-w-[110px]">{pet.owner?.name || "Sin dueño"}</span>
                        </div>
                        {temp && (
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${temp.cls}`}>
                            {temp.label}
                          </span>
                        )}
                        {pet.allergies && (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-500">
                            Alergia
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
