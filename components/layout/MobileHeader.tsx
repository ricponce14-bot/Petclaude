"use client";
import { LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Inicio",
    "/agenda": "Agenda",
    "/clientes": "Clientes",
    "/mascotas": "Mascotas",
    "/gastos": "Gastos",
    "/inventario": "Inventario",
    "/whatsapp": "WhatsApp",
    "/conversaciones": "Conversaciones",
    "/mensajes": "Mensajes",
    "/mensajes/outbox": "Enviados",
    "/bot": "Bot Automático",
    "/membresia": "Membresía",
    "/ajustes":   "Ajustes",
};

export default function MobileHeader() {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    const title = PAGE_TITLES[pathname] ?? "Ladrido";

    return (
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-4 flex items-center justify-between z-40"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
            <div className="flex items-center gap-3">
                <img src="/images/logo-color.png" alt="Ladrido" className="h-7 w-auto object-contain" />
                <span className="text-sm font-bold text-slate-700 border-l border-slate-200 pl-3">{title}</span>
            </div>
            <div className="flex items-center gap-2">
                <Link
                    href="/ajustes"
                    aria-label="Ajustes"
                    className="flex items-center justify-center w-11 h-11 bg-slate-50 text-slate-500 rounded-xl hover:bg-mint/10 hover:text-mint transition-all border border-slate-100"
                >
                    <Settings size={18} />
                </Link>
                <button
                    onClick={handleLogout}
                    aria-label="Cerrar sesión"
                    className="flex items-center justify-center w-11 h-11 bg-slate-50 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}
