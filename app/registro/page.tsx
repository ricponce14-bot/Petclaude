"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SteppedRegisterForm from "@/components/auth/SteppedRegisterForm";

export default function RegistroPage() {
    const params = useSearchParams();
    const plan = params.get("plan") || "monthly";

    return (
        <div className="min-h-screen bg-cream flex flex-col">
            {/* Header minimal */}
            <header className="px-6 py-4 flex justify-between items-center">
                <Link href="/">
                    <img src="/images/logo-color.png" alt="Ladrido" className="h-8 w-auto object-contain" />
                </Link>
                <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                    Ya tengo cuenta →
                </Link>
            </header>

            {/* Form container */}
            <div className="flex-1 flex items-start xs:items-center justify-center px-4 py-8">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-[2rem] shadow-soft-purple border border-slate-100 p-7 xs:p-8">
                        <div className="mb-7">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Crea tu cuenta</h1>
                            <p className="text-slate-500 text-sm mt-1">7 días gratis · Sin tarjeta · Cancela cuando quieras</p>
                        </div>
                        <SteppedRegisterForm initialPlan={plan} />
                    </div>
                </div>
            </div>
        </div>
    );
}
