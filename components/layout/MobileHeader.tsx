"use client";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function MobileHeader() {
    const supabase = createClient();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    return (
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 flex items-center justify-between z-40">
            <img src="/images/logo-color.png" alt="Ladrido" className="h-8 w-auto object-contain" />
            <button
                onClick={handleLogout}
                className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
            >
                <LogOut size={20} />
            </button>
        </header>
    );
}
