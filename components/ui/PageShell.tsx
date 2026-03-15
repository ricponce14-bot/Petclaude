"use client";
/**
 * PageShell — Wrapper de página con animación de entrada
 * Envuelve el contenido de cada página del dashboard con stagger automático.
 *
 * Uso:
 *   <PageShell title="Clientes" subtitle="Gestiona tu base de datos">
 *     ...contenido
 *   </PageShell>
 */

import { motion } from "framer-motion";

interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function PageShell({ children, title, subtitle, action, className }: PageShellProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`px-4 md:px-8 py-6 max-w-7xl mx-auto ${className ?? ""}`}
    >
      {(title || action) && (
        <motion.div variants={itemVariants} className="flex items-start justify-between mb-6 gap-4">
          <div>
            {title && (
              <h1 className="text-2xl font-black text-[#1A1A1A] leading-tight">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm text-[#9e8a7a] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </motion.div>
      )}
      {children}
    </motion.div>
  );
}

/** Exportar itemVariants para que las páginas puedan usarlo en sus hijos */
export { itemVariants, containerVariants };
