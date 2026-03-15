"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50
                 bg-white border-t border-[#F0E6D8]"
      style={{
        boxShadow: "0 -4px 24px rgba(0,0,0,0.07)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-stretch justify-around px-2 pt-2 pb-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-end flex-1 gap-1 pb-1 min-h-[56px]"
            >
              <div className="relative flex flex-col items-center">
                {/* Pill indicator activo */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -top-1.5 w-8 h-1 rounded-full bg-[#FF8C42]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icono */}
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={`flex items-center justify-center w-11 h-10 rounded-[16px]
                              transition-colors duration-200
                              ${isActive ? "bg-orange-50" : ""}`}
                >
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? "text-[#FF8C42]" : "text-[#BBA898]"}
                  />
                </motion.div>
              </div>

              <span className={`text-[10px] leading-none font-semibold transition-colors duration-200
                                ${isActive ? "text-[#FF8C42] font-bold" : "text-[#BBA898]"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
