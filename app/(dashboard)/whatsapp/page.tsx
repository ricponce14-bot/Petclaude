"use client";
// app/(dashboard)/whatsapp/page.tsx
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { QrCode, Wifi, WifiOff, RefreshCw, Loader2, Bell, Calendar } from "lucide-react";
import type { WaSession } from "@/lib/supabase/types";

export default function WhatsAppPage() {
  const supabase = createClient();
  const [session, setSession] = useState<WaSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [qrFromApi, setQrFromApi] = useState<string | null>(null);

  const fetchSession = async () => {
    const { data } = await supabase.from("wa_sessions").select("*").single();
    setSession(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSession();
    // Polling suave: solo verificar estado, NO reconectar
    const interval = setInterval(async () => {
      if (session?.status === "qr_needed" || (session as any)?.status === "connecting") {
        // Solo verificar si cambió el estado (sin llamar connect)
        try {
          await fetch("/api/whatsapp/fetch-qr", { method: "POST" });
        } catch (e) { /* silenciar */ }
      }
      fetchSession();
    }, 8000);
    return () => clearInterval(interval);
  }, [session?.status]);

  const createInstance = async () => {
    setCreating(true);
    setQrFromApi(null);
    try {
      const res = await fetch("/api/whatsapp/create-instance", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // Mostrar QR directamente de la respuesta
        if (data.qr_code) {
          setQrFromApi(data.qr_code);
        }
        fetchSession();
      } else {
        const errorData = await res.json();
        alert(`Error conectando a WhatsApp: ${errorData.error || "Revisa que tu servidor esté encendido."}`);
      }
    } catch (e: any) {
      alert(`Error de red: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  const disconnectInstance = async () => {
    if (!confirm("¿Estás seguro de que deseas desconectar WhatsApp? Esto pausará todas las automatizaciones.")) return;
    setCreating(true);
    try {
      const res = await fetch("/api/whatsapp/delete-instance", { method: "POST" });
      if (res.ok) {
        setSession(null);
        fetchSession();
      } else {
        const errorData = await res.json();
        alert(`Error desconectando: ${errorData.error}`);
      }
    } catch (e: any) {
      alert(`Error de red: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Determinar qué QR mostrar: de la API directamente o de la BD
  const displayQr = qrFromApi || (session as any)?.qr_code;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Conexión WhatsApp</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {/* Status badge */}
        <div className="flex items-center gap-3 mb-6">
          {session?.status === "connected" ? (
            <><Wifi size={20} className="text-green-500" />
              <div>
                <p className="font-semibold text-green-700">Conectado</p>
                <p className="text-xs text-gray-400">Instancia: {session.instance}</p>
              </div>
            </>
          ) : session?.status === "qr_needed" ? (
            <><QrCode size={20} className="text-teal-500" />
              <div>
                <p className="font-semibold text-teal-700">Escanea el código QR</p>
                <p className="text-xs text-gray-400">Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
              </div>
            </>
          ) : (
            <><WifiOff size={20} className="text-gray-400" />
              <div>
                <p className="font-semibold text-gray-600">Desconectado</p>
                <p className="text-xs text-gray-400">Crea una instancia para conectar tu WhatsApp</p>
              </div>
            </>
          )}
        </div>

        {/* QR Code display */}
        {session?.status === "qr_needed" && displayQr && (
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="border-4 border-teal-500 rounded-2xl p-2 bg-white">
              <img
                src={displayQr.startsWith("data:") ? displayQr : `data:image/png;base64,${displayQr}`}
                alt="WhatsApp QR Code"
                className="w-52 h-52"
              />
            </div>
            <p className="text-xs text-gray-400 text-center">El código se actualiza cada 20 segundos</p>
          </div>
        )}

        {/* Mensaje si hay sesión qr_needed pero sin QR visible */}
        {session?.status === "qr_needed" && !displayQr && (
          <div className="flex flex-col items-center gap-3 mb-4 p-4 bg-amber-50 rounded-xl">
            <Loader2 size={24} className="text-amber-500 animate-spin" />
            <p className="text-sm text-amber-700 text-center">
              Generando código QR... Esto puede tardar unos segundos.
            </p>
            <button
              onClick={createInstance}
              disabled={creating}
              className="mt-2 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60"
            >
              {creating ? "Regenerando..." : "Regenerar QR"}
            </button>
          </div>
        )}

        {/* Actions */}
        {!session && (
          <button
            onClick={createInstance}
            disabled={creating}
            className="w-full bg-teal-600 text-white font-medium py-3 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60"
          >
            {creating ? "Creando instancia (~15s)..." : "Conectar WhatsApp"}
          </button>
        )}

        {session?.status === "disconnected" && (
          <button
            onClick={createInstance}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white font-medium py-3 rounded-xl hover:bg-teal-700"
          >
            <RefreshCw size={16} /> Reconectar
          </button>
        )}

        {session?.status === "connected" && (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4 text-sm text-green-700">
              Las automatizaciones estan activas. Los recordatorios, win-backs y cumpleanos se enviaran automaticamente.
            </div>
            <button
              onClick={disconnectInstance}
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-700 font-bold text-sm py-2 transition-colors"
            >
              {creating ? <Loader2 className="animate-spin" size={16} /> : <WifiOff size={16} />}
              Desconectar WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-3">
        {[
          { icon: Bell, title: "Recordatorio 24h", desc: "Se envia automaticamente un dia antes de cada cita" },
          { icon: RefreshCw, title: "Win-back 30 dias", desc: "Mensaje automatico si una mascota no visita en 30 dias" },
          { icon: Calendar, title: "Cumpleanos", desc: "Felicitacion con descuento a las 9:00 AM del cumpleanos" },
        ].map(item => (
          <div key={item.title} className="flex gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
            <item.icon size={20} className="text-teal-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">{item.title}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
