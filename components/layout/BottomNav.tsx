"use client";
// components/layout/BottomNav.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, PawPrint, MessageCircle, LayoutDashboard, Bot } from "lucide-react";

const navItems = [
    { href: "/dashboard",       icon: LayoutDashboard, label: "Inicio"   },
    { href: "/agenda",          icon: CalendarDays,    label: "Agenda"   },
    { href: "/mascotas",        icon: PawPrint,        label: "Mascotas" },
    { href: "/bot",             icon: Bot,             label: "Bot"      },
    { href: "/mensajes/outbox", icon: MessageCircle,   label: "Enviados" },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100"
            style={{
                boxShadow: "0 -4px 6px -1px rgba(0,0,0,0.05)",
                paddingBottom: "env(safe-area-inset-bottom)",
            }}
        >
            <div className="flex items-stretch justify-around px-1 pt-1 pb-2">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center justify-center flex-1 gap-0.5 min-h-[56px] min-w-[48px]"
                        >
                            {/* Zona táctil amplia: el div interno cubre 48×48 px mínimo */}
                            <div
                                className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                                    isActive ? "bg-mint/10" : ""
                                }`}
                            >
                                <Icon
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={isActive ? "text-mint" : "text-[#A0AEC0]"}
                                />
                            </div>
                            <span
                                className={`text-[10px] leading-none font-semibold transition-colors duration-200 ${
                                    isActive ? "text-mint font-bold" : "text-[#A0AEC0]"
                                }`}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
