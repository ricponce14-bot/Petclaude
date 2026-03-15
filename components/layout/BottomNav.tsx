"use client";
// components/layout/BottomNav.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, PawPrint, MessageCircle, LayoutDashboard, Bot } from "lucide-react";

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
    { href: "/agenda", icon: CalendarDays, label: "Agenda" },
    { href: "/mascotas", icon: PawPrint, label: "Mascotas" },
    { href: "/bot", icon: Bot, label: "Bot" },
    { href: "/mensajes/outbox", icon: MessageCircle, label: "Enviados" },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="flex items-stretch justify-around px-1 pt-2 pb-3">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center justify-center flex-1 gap-1 min-h-[48px] relative group"
                        >
                            <div
                                className={`flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ${
                                    isActive
                                        ? "bg-teal-100 text-teal-600 scale-105 shadow-sm"
                                        : "text-slate-400 group-hover:text-teal-500 group-hover:bg-teal-50"
                                }`}
                            >
                                <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span
                                className={`text-xs font-semibold leading-none transition-colors duration-300 ${
                                    isActive ? "text-teal-700 font-bold" : "text-slate-400"
                                }`}
                            >
                                {label}
                            </span>
                            {isActive && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-teal-500 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
