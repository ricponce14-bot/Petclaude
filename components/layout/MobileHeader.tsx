"use client";
import { LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":        "Inicio",
  "/agenda":           "Agenda",
  "/clientes":         "Clientes",
  "/mascotas":         "Mascotas",
  "/gastos":           "Gastos",
  "/inventario":       "Inventario",
  "/whatsapp":         "WhatsApp",
  "/conversaciones":   "Conversaciones",
  "/mensajes":         "Mensajes",
  "/mensajes/outbox":  "Enviados",
  "/bot":              "Bot Automático",
  "/membresia":        "Membresía",
  "/ajustes":          "Ajustes",
};

export default function MobileHeader() {
  const supabase  = createClient();
  const router    = useRouter();
  const pathname  = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const title = PAGE_TITLES[pathname] ?? "Ladrido";

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 h-14 z-40
                 bg-[#FFF9F0]/95 backdrop-blur-xl
                 border-b border-[#F0E6D8]
                 px-4 flex items-center justify-between"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Logo + título */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-[12px] bg-[#FF8C42] flex items-center justify-center
                        shadow-[0_4px_12px_rgba(255,140,66,0.30)]">
          <span className="text-white font-black text-sm leading-none">L</span>
        </div>
        <span className="text-sm font-bold text-[#1A1A1A]
                         border-l border-[#F0E6D8] pl-3">
          {title}
        </span>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        <motion.div whileTap={{ scale: 0.92 }}>
          <Link
            href="/ajustes"
            aria-label="Ajustes"
            className="flex items-center justify-center w-10 h-10
                       bg-[#FFF3E3] text-[#9e8a7a] rounded-[14px]
                       border border-[#F0E6D8]
                       hover:bg-orange-50 hover:text-[#FF8C42]
                       transition-colors duration-200"
          >
            <Settings size={17} />
          </Link>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="flex items-center justify-center w-10 h-10
                     bg-[#FFF3E3] text-[#9e8a7a] rounded-[14px]
                     border border-[#F0E6D8]
                     hover:bg-red-50 hover:text-red-500
                     transition-colors duration-200"
        >
          <LogOut size={17} />
        </motion.button>
      </div>
    </header>
  );
}
