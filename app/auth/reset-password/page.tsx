"use client";
// app/auth/reset-password/page.tsx
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Supabase envía el token en el hash — el cliente lo maneja automáticamente
  useEffect(() => {
    // Verificar que llegamos desde un enlace válido
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        // No hay sesión activa — puede que el link haya expirado
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }

    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2500);
  };

  const inputCls =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm font-medium text-slate-800 " +
    "focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint transition-all placeholder:text-slate-300";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-slate-100 p-8">
          <div className="text-center mb-7">
            <img src="/images/logo-color.png" alt="Ladrido" className="w-[130px] h-auto mx-auto mb-4 object-contain" />
            <h1 className="text-xl font-black text-ink">Nueva contraseña</h1>
            <p className="text-slate-400 text-sm mt-1">Elige una contraseña segura</p>
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 size={48} className="text-mint mx-auto" />
              <p className="text-sm font-semibold text-slate-600">
                ¡Contraseña actualizada! Redirigiendo...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={inputCls}
                  placeholder="Nueva contraseña"
                />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className={inputCls}
                  placeholder="Confirmar contraseña"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 font-medium">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
