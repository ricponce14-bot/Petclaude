"use client";
// app/login/page.tsx
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

type View = "login" | "forgot";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.refresh();
    router.push("/dashboard");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setResetSent(true);
  };

  const inputCls =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 " +
    "focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint transition-all placeholder:text-slate-300";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-slate-100 p-8">

          {/* Logo + título */}
          <div className="text-center mb-7">
            <img
              src="/images/logo-color.png"
              alt="Ladrido"
              className="w-[140px] h-auto mx-auto mb-4 object-contain"
            />
            <h1 className="text-xl font-black text-ink">
              {view === "login" ? "Bienvenido de vuelta" : "Recuperar contraseña"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {view === "login" ? "Ingresa a tu cuenta" : "Te enviamos un enlace por email"}
            </p>
          </div>

          {/* ── Vista: LOGIN ─────────────────────────────── */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={`${inputCls} pl-10`}
                  placeholder="tu@email.com"
                />
              </div>

              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={`${inputCls} pl-10`}
                  placeholder="••••••••"
                />
              </div>

              {/* Olvidé mi contraseña */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setView("forgot"); setError(""); }}
                  className="text-xs font-semibold text-mint hover:text-mint-dark transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
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
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          )}

          {/* ── Vista: FORGOT ─────────────────────────────── */}
          {view === "forgot" && !resetSent && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={`${inputCls} pl-10`}
                  placeholder="tu@email.com"
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
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>

              <button
                type="button"
                onClick={() => { setView("login"); setError(""); }}
                className="w-full text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors py-1"
              >
                ← Volver al inicio de sesión
              </button>
            </form>
          )}

          {/* ── Vista: RESET ENVIADO ─────────────────────── */}
          {view === "forgot" && resetSent && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-mint/10 rounded-full flex items-center justify-center mx-auto">
                <Mail size={24} className="text-mint" />
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Enviamos un enlace a <span className="font-bold text-ink">{email}</span>.
                Revisa tu bandeja de entrada (y spam).
              </p>
              <button
                onClick={() => { setView("login"); setResetSent(false); setError(""); }}
                className="btn-secondary w-full justify-center py-3"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>

        {/* Pie */}
        <p className="text-center text-sm text-slate-400 mt-5">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-bold text-mint hover:text-mint-dark transition-colors">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
