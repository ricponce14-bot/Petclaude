"use client";
/**
 * ModalShell — Envoltorio de modal reutilizable con efecto bounce
 *
 * Uso:
 *   <ModalShell title="Nueva cita" onClose={onClose}>
 *     ...contenido
 *   </ModalShell>
 */

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidth?: string;
  accentColor?: "orange" | "purple" | "teal";
}

const ACCENT = {
  orange: { dot: "bg-[#E8542F]", close: "hover:bg-orange-50 hover:text-[#E8542F]" },
  purple: { dot: "bg-[#0E8C6D]", close: "hover:bg-[#E9F3EE] hover:text-[#0E8C6D]"   },
  teal:   { dot: "bg-[#0E8C6D]", close: "hover:bg-[#E9F3EE] hover:text-[#0E8C6D]"   },
};

export default function ModalShell({
  children,
  title,
  subtitle,
  onClose,
  maxWidth = "max-w-md",
  accentColor = "orange",
}: ModalShellProps) {
  const ac = ACCENT[accentColor];

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4
                   bg-[#241C15]/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.82, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.90, y: 12 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 26,
          }}
          className={`bg-white rounded-[40px] w-full ${maxWidth}
                      max-h-[92vh] overflow-y-auto overflow-x-hidden
                      shadow-[0_32px_80px_rgba(0,0,0,0.18)]`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ─────────────────────────────── */}
          <div className="flex items-center justify-between px-7 pt-7 pb-5">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${ac.dot} shrink-0`} />
              <div>
                <h2 className="font-black text-[#241C15] text-lg leading-tight">{title}</h2>
                {subtitle && (
                  <p className="text-xs text-[#8B7A6A] font-medium mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className={`w-9 h-9 rounded-[14px] flex items-center justify-center
                          text-[#8B7A6A] transition-colors duration-200 ${ac.close}`}
            >
              <X size={18} />
            </motion.button>
          </div>

          {/* ── Content ────────────────────────────── */}
          <div className="px-7 pb-7">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
