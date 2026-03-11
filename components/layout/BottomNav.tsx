"use client";
// components/layout/BottomNav.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, PawPrint, QrCode, MessageCircle, DollarSign } from "lucide-react";

const navItems = [
    { href: "/agenda", icon: CalendarDays, label: "Agenda" },
    { href: "/clientes", icon: Users, label: "Clientes" },
    { href: "/gastos", icon: DollarSign, label: "Gastos" },
    { href: "/mensajes/outbox", icon: MessageCircle, label: "Mensajes" },
    { href: "/whatsapp", icon: QrCode, label: "WhatsApp" },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-gray-200 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.05)] bg-white/90 backdrop-blur-xl">
            <div className="flex items-center justify-around px-2 pb-5 pt-3">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center justify-center w-16 gap-1 relative group"
                        >
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isActive
                                    ? "bg-teal-100 text-teal-600 scale-110 shadow-sm"
                                    : "text-gray-400 group-hover:text-teal-500 group-hover:bg-teal-50"
                                    }`}
                            >
                                <Icon size={20} className={isActive ? "animate-pulse-slow" : ""} />
                            </div>
                            <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? "text-teal-700 font-bold" : "text-gray-500"
                                }`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
