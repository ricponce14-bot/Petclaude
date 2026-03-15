"use client";
/**
 * MotionCard — Bento card reutilizable con animación de entrada escalonada
 *
 * Uso:
 *   <MotionCard delay={0.1} className="col-span-2">...</MotionCard>
 *   <MotionCard variant="orange">...</MotionCard>
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "white" | "orange" | "purple" | "teal" | "cream";

const variantClasses: Record<Variant, string> = {
  white:  "bg-white border-[#F0E6D8]",
  orange: "bg-[#FFF4EC] border-orange-100",
  purple: "bg-purple-50 border-purple-100",
  teal:   "bg-teal-50 border-teal-50",
  cream:  "bg-[#FFF3E3] border-[#F0E6D8]",
};

interface MotionCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: Variant;
  hover?: boolean;
  onClick?: () => void;
}

export default function MotionCard({
  children,
  className,
  delay = 0,
  variant = "white",
  hover = true,
  onClick,
}: MotionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={hover ? { y: -4, boxShadow: "0 12px 48px rgba(0,0,0,0.10)" } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "rounded-[32px] border shadow-[0_4px_32px_rgba(0,0,0,0.06)]",
        "transition-shadow duration-300",
        variantClasses[variant],
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

/** Versión stat para métricas del dashboard */
export function StatCard({
  label,
  value,
  icon,
  color = "orange",
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: "orange" | "purple" | "teal";
  delay?: number;
}) {
  const colorMap = {
    orange: { bg: "bg-[#FFF4EC]", text: "text-[#FF8C42]", border: "border-orange-100" },
    purple: { bg: "bg-purple-50",  text: "text-[#9B5DE5]", border: "border-purple-100" },
    teal:   { bg: "bg-teal-50",    text: "text-[#00C4AA]", border: "border-teal-50"   },
  };
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, boxShadow: "0 12px 48px rgba(0,0,0,0.10)" }}
      className={`rounded-[32px] border p-6 ${c.bg} ${c.border} shadow-[0_4px_32px_rgba(0,0,0,0.06)]`}
    >
      {icon && (
        <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center mb-4 ${c.bg} border ${c.border}`}>
          <span className={c.text}>{icon}</span>
        </div>
      )}
      <p className="text-3xl font-black text-[#1A1A1A] leading-none mb-1">{value}</p>
      <p className="text-sm text-[#9e8a7a] font-medium">{label}</p>
    </motion.div>
  );
}
