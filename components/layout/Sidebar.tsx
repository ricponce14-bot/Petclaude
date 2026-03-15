"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    CalendarDays, Users, PawPrint, MessageCircle, LayoutDashboard,
    QrCode, LogOut, CreditCard, DollarSign, Bot, Inbox, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const links = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, group: "main" },
    { href: "/agenda", label: "Agenda", icon: CalendarDays, group: "main" },
    { href: "/clientes", label: "Clientes", icon: Users, group: "main" },
    { href: "/mascotas", label: "Mascotas", icon: PawPrint, group: "main" },
    { href: "/gastos", label: "Gastos", icon: DollarSign, group: "finance" },
    { href: "/inventario", label: "Inventario", icon: Package, group: "finance" },
    { href: "/whatsapp", label: "WhatsApp", icon: QrCode, group: "automation" },
    { href: "/conversaciones", label: "Chats en vivo", icon: Inbox, group: "automation" },
    { href: "/mensajes", label: "Plantillas", icon: MessageCircle, group: "automation" },
    { href: "/mensajes/outbox", label: "Seguimiento", icon: MessageCircle, group: "automation" },
    { href: "/bot", label: "Bot Automático", icon: Bot, group: "automation" },
    { href: "/membresia", label: "Membresía", icon: CreditCard, group: "account" },
];

const GROUP_LABELS: Record<string, string> = {
    main: "Principal",
    finance: "Finanzas",
    automation: "Automatización",
    account: "Cuenta",
};

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [supabase] = useState(() => createClient());

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    const groups = ["main", "finance", "automation", "account"];

    return (
        <aside className="w-56 bg-charcoal text-white flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 py-4 border-b border-white/10 flex justify-center">
                <img src="/images/logo-white.png" alt="Ladrido" className="w-[130px] h-auto object-contain" />
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
                {groups.map(group => {
                    const groupLinks = links.filter(l => l.group === group);
                    return (
                        <div key={group}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 px-3 mb-1.5">
                                {GROUP_LABELS[group]}
                            </p>
                            <div className="space-y-0.5">
                                {groupLinks.map(({ href, label, icon: Icon }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                            pathname === href
                                                ? "bg-teal-500/20 text-teal-400 font-bold"
                                                : "text-white/50 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        <Icon size={17} strokeWidth={pathname === href ? 2.5 : 2} />
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="py-4 px-3 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
                >
                    <LogOut size={17} />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}
