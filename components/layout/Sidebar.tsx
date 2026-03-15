"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Users, PawPrint, MessageCircle, LayoutDashboard,
  QrCode, LogOut, CreditCard, DollarSign, Bot, Inbox, Package, Settings
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard",          label: "Inicio",         icon: LayoutDashboard, group: "main" },
  { href: "/agenda",             label: "Agenda",          icon: CalendarDays,    group: "main" },
  { href: "/clientes",           label: "Clientes",        icon: Users,           group: "main" },
  { href: "/mascotas",           label: "Mascotas",        icon: PawPrint,        group: "main" },
  { href: "/gastos",             label: "Gastos",          icon: DollarSign,      group: "finance" },
  { href: "/inventario",         label: "Inventario",      icon: Package,         group: "finance" },
  { href: "/whatsapp",           label: "WhatsApp",        icon: QrCode,          group: "automation" },
  { href: "/conversaciones",     label: "Chats en vivo",   icon: Inbox,           group: "automation" },
  { href: "/mensajes",           label: "Plantillas",      icon: MessageCircle,   group: "automation" },
  { href: "/bot",                label: "Bot Automático",  icon: Bot,             group: "automation" },
  { href: "/membresia",          label: "Membresía",       icon: CreditCard,      group: "account" },
  { href: "/ajustes",            label: "Ajustes",         icon: Settings,        group: "account" },
];

const GROUP_LABELS: Record<string, string> = {
  main:       "Principal",
  finance:    "Finanzas",
  automation: "Automatización",
  account:    "Cuenta",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [expanded, setExpanded]   = useState(false);
  const [supabase] = useState(() => createClient());

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const groups = ["main", "finance", "automation", "account"];

  return (
    <motion.aside
      initial={false}
      animate={{ width: expanded ? 220 : 72 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="relative h-full flex flex-col overflow-hidden
                 bg-[#1a1a2e] border-r border-white/5
                 rounded-r-[32px] z-20 shadow-[4px_0_32px_rgba(10,10,30,0.25)]"
      style={{ flexShrink: 0 }}
    >
      {/* ── Logo ─────────────────────────────────────── */}
      <div className="flex items-center h-16 px-3 border-b border-white/10 shrink-0 overflow-hidden">
        <img
          src="/images/logo-white.png"
          alt="Ladrido"
          className={`object-contain transition-all duration-200 shrink-0 ${expanded ? "h-8 w-auto max-w-[140px]" : "h-8 w-8"}`}
        />
      </div>

      {/* ── Nav ──────────────────────────────────────── */}
      <nav className="flex-1 py-4 px-2 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {groups.map(group => {
          const groupLinks = links.filter(l => l.group === group);
          return (
            <div key={group}>
              <AnimatePresence>
                {expanded && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-[9px] font-black uppercase tracking-[0.15em]
                               text-white/25 px-3 mb-1.5 whitespace-nowrap"
                  >
                    {GROUP_LABELS[group]}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="space-y-0.5">
                {groupLinks.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <NavItem
                      key={href}
                      href={href}
                      label={label}
                      icon={Icon}
                      isActive={isActive}
                      expanded={expanded}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Logout ───────────────────────────────────── */}
      <div className="py-4 px-2 border-t border-white/10 shrink-0">
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[16px]
                     text-white/30 hover:text-red-400 hover:bg-red-500/10
                     transition-colors duration-200"
        >
          <LogOut size={18} className="shrink-0" />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Cerrar sesión
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}

/* ── NavItem subcomponent ─────────────────────── */
function NavItem({
  href, label, icon: Icon, isActive, expanded,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  expanded: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative">
      <Link href={href}>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[16px]
                      cursor-pointer transition-colors duration-200 overflow-hidden
                      ${isActive
                        ? "bg-[#FF8C42]/15 text-white"
                        : "text-white/40 hover:bg-white/6 hover:text-white/80"
                      }`}
        >
          {/* Dot activo */}
          {isActive && (
            <motion.div
              layoutId="active-dot"
              className="absolute left-0 top-1/2 -translate-y-1/2
                         w-1 h-5 rounded-r-full bg-[#FF8C42]"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}

          <div className="relative shrink-0">
            <Icon
              size={18}
              strokeWidth={isActive ? 2.5 : 1.8}
              className={isActive ? "text-[#FF8C42]" : ""}
            />
            {/* Halo naranja al hover */}
            {hovered && !isActive && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.8, opacity: 0.15 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 rounded-full bg-[#FF8C42]"
              />
            )}
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </Link>

      {/* Tooltip — solo cuando está contraído */}
      <AnimatePresence>
        {hovered && !expanded && (
          <motion.div
            initial={{ opacity: 0, x: -4, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -4, scale: 0.92 }}
            transition={{ duration: 0.14 }}
            className="absolute left-[68px] top-1/2 -translate-y-1/2 z-50
                       bg-[#2a2a4e] text-white text-xs font-semibold
                       px-3 py-1.5 rounded-[12px] whitespace-nowrap
                       shadow-[0_8px_24px_rgba(0,0,0,0.3)]
                       border border-white/10 pointer-events-none"
          >
            {label}
            {/* Arrow */}
            <span className="absolute -left-1.5 top-1/2 -translate-y-1/2
                             w-2.5 h-2.5 bg-[#1E0A3C] border-l border-b border-white/10
                             rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
