"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Users, PawPrint, MessageCircle, LayoutDashboard, QrCode, LogOut, CreditCard, DollarSign, Bot, Inbox, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/mascotas", label: "Mascotas", icon: PawPrint },
  { href: "/gastos", label: "Gastos", icon: DollarSign },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/whatsapp", label: "WhatsApp", icon: QrCode },
  { href: "/conversaciones", label: "Chats en vivo", icon: Inbox },
  { href: "/mensajes", label: "Plantillas", icon: MessageCircle },
  { href: "/mensajes/outbox", label: "Seguimiento", icon: MessageCircle },
  { href: "/bot", label: "Bot Automático", icon: Bot },
  { href: "/membresia", label: "Membresía", icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-5 py-3 border-b border-gray-800 flex justify-center">
        <img src="/images/logo-white.png" alt="Ladrido" className="w-[140px] h-auto object-contain" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-teal-500/20 text-teal-400"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="py-4 border-t border-gray-800 flex justify-center mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors w-full mx-3"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
