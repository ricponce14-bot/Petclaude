"use client";
// components/dashboard/TrialBanner.tsx
import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";

interface Props {
    plan: string;
    daysLeft: number;
}

export default function TrialBanner({ plan, daysLeft }: Props) {
    if (plan === "past_due") {
        return (
            <div className="bg-red-500 text-white px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle size={15} className="shrink-0" />
                    Hay un problema con tu pago. Actualiza tu método para no perder acceso.
                </div>
                <Link href="/membresia" className="text-xs font-black bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                    Resolver →
                </Link>
            </div>
        );
    }

    // trial con 1–3 días
    return (
        <div className="bg-sand text-white px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock size={15} className="shrink-0" />
                Tu prueba gratuita vence en <strong>{daysLeft} {daysLeft === 1 ? "día" : "días"}</strong>.
            </div>
            <Link href="/membresia" className="text-xs font-black bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                Suscribirme →
            </Link>
        </div>
    );
}
