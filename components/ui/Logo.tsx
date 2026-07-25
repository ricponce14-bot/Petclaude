// components/ui/Logo.tsx
// Marca tipográfica de Apúntame: símbolo (palomita de "cita apuntada" en caja
// de barro con punto cempasúchil) + wordmark en Metropolis.
// Reemplaza a los PNGs del branding anterior.

interface LogoProps {
  /** "light" = para fondos claros (texto espresso) · "dark" = para fondos oscuros (texto blanco) */
  variant?: "light" | "dark";
  /** Tamaño total de la marca */
  size?: "sm" | "md" | "lg";
  /** Solo el símbolo, sin texto */
  markOnly?: boolean;
  className?: string;
}

const SIZES = {
  sm: { box: 26, text: "text-lg",  gap: "gap-2"   },
  md: { box: 32, text: "text-xl",  gap: "gap-2.5" },
  lg: { box: 40, text: "text-3xl", gap: "gap-3"   },
};

export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 48 48" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true"
    >
      {/* Caja de barro */}
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#E8542F" />
      {/* Palomita de cita apuntada */}
      <path
        d="M14 25.5 L21 32.5 L34 17"
        stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Punto cempasúchil */}
      <circle cx="36.5" cy="33.5" r="4" fill="#F2B035" />
    </svg>
  );
}

export default function Logo({ variant = "light", size = "md", markOnly = false, className = "" }: LogoProps) {
  const s = SIZES[size];
  if (markOnly) return <LogoMark size={s.box} className={className} />;

  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <LogoMark size={s.box} />
      <span
        className={`font-black tracking-tight leading-none ${s.text} ${
          variant === "dark" ? "text-white" : "text-[#241C15]"
        }`}
      >
        apúntame<span className="text-[#E8542F]">.</span><span className="text-[#0E8C6D]">mx</span>
      </span>
    </span>
  );
}
