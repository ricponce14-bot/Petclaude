"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bot, Save, Loader2, Plus, Trash2, Clock, Power, MessageSquare, DollarSign, Settings, Sparkles, Activity, CalendarCheck } from "lucide-react";
import type { BotConfig, BotService, BotBusinessHours } from "@/lib/supabase/types";

const DEFAULT_SERVICES: BotService[] = [
  { key: "bath", label: "Baño", duration_min: 60, price: 350 },
  { key: "haircut", label: "Corte", duration_min: 90, price: 450 },
  { key: "bath_haircut", label: "Baño + Corte", duration_min: 120, price: 600 },
];

const DAY_LABELS: Record<string, string> = {
  lun: "Lunes", mar: "Martes", mie: "Miércoles",
  jue: "Jueves", vie: "Viernes", sab: "Sábado", dom: "Domingo"
};

const DEFAULT_HOURS: BotBusinessHours = {
  lun: { open: "09:00", close: "18:00" },
  mar: { open: "09:00", close: "18:00" },
  mie: { open: "09:00", close: "18:00" },
  jue: { open: "09:00", close: "18:00" },
  vie: { open: "09:00", close: "18:00" },
  sab: { open: "09:00", close: "14:00" },
  dom: null
};

const DEFAULT_WELCOME = `¡Hola! 🐾 Bienvenido. ¿En qué podemos ayudarte?

1️⃣ Agendar cita
2️⃣ Ver precios
3️⃣ Hablar con un asesor`;

const DEFAULT_CONFIRMATION = `✅ ¡Cita confirmada!

📋 Servicio: {servicio}
📅 Fecha: {fecha}
🕐 Hora: {hora}

¡Te esperamos! 🐕`;

export default function BotConfigPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [metrics, setMetrics] = useState({ totalMessages: 0, totalAppts: 0 });

  // Estado del formulario
  const [isEnabled, setIsEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(DEFAULT_WELCOME);
  const [services, setServices] = useState<BotService[]>(DEFAULT_SERVICES);
  const [businessHours, setBusinessHours] = useState<BotBusinessHours>(DEFAULT_HOURS);
  const [slotDuration, setSlotDuration] = useState(60);
  const [confirmationTemplate, setConfirmationTemplate] = useState(DEFAULT_CONFIRMATION);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from("bot_config").select("*").single();

    if (data) {
      const config = data as any;
      setIsEnabled(config.is_enabled || false);
      setWelcomeMessage(config.welcome_message || DEFAULT_WELCOME);
      setServices(
        typeof config.services === "string"
          ? JSON.parse(config.services)
          : config.services || DEFAULT_SERVICES
      );
      setBusinessHours(
        typeof config.business_hours === "string"
          ? JSON.parse(config.business_hours)
          : config.business_hours || DEFAULT_HOURS
      );
      setSlotDuration(config.slot_duration_min || 60);
      setConfirmationTemplate(config.confirmation_template || DEFAULT_CONFIRMATION);
    }
    
    // Get metrics
    const { data: { session } } = await supabase.auth.getSession();
    const tenantId = session?.user.app_metadata?.tenant_id || session?.user.user_metadata?.tenant_id;
    if (tenantId) {
      const [{ count: msgs }, { count: appts }] = await Promise.all([
        supabase.from("wa_messages").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).in("type", ["bot_reply", "bot_incoming"]),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).like("notes", "%Agendado por Bot WhatsApp%")
      ]);
      setMetrics({ totalMessages: msgs || 0, totalAppts: appts || 0 });
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const { data: { session } } = await supabase.auth.getSession();
    const tenantId = session?.user.app_metadata?.tenant_id || session?.user.user_metadata?.tenant_id;

    if (!tenantId) {
      alert("No se pudo identificar tu negocio. Por favor, vuelve a iniciar sesión.");
      setSaving(false);
      return;
    }

    const payload = {
      tenant_id: tenantId,
      is_enabled: isEnabled,
      welcome_message: welcomeMessage,
      services: services,
      business_hours: businessHours,
      slot_duration_min: slotDuration,
      confirmation_template: confirmationTemplate,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("bot_config")
      .upsert(payload as any, { onConflict: "tenant_id" });

    if (error) {
      console.error("Error saving bot config:", error);
      alert("Error al guardar: " + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  // === Handlers de servicios ===
  const addService = () => {
    setServices([...services, { key: `custom_${Date.now()}`, label: "", duration_min: 60, price: 0 }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof BotService, value: string | number) => {
    const updated = [...services];
    if (field === "label") {
      updated[index] = { ...updated[index], label: value as string, key: (value as string).toLowerCase().replace(/\s+/g, "_") };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setServices(updated);
  };

  // === Handlers de horarios ===
  const toggleDay = (day: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: prev[day] ? null : { open: "09:00", close: "18:00" }
    }));
  };

  const updateHour = (day: string, field: "open" | "close", value: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : { open: "09:00", close: "18:00", [field]: value }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24 md:pb-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Bot className="text-teal-500" size={32} />
            Bot de WhatsApp
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Configura el bot para que tus clientes agenden citas automáticamente.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
            saved
              ? "bg-green-500 text-white"
              : "bg-slate-900 text-white hover:bg-teal-500"
          }`}
        >
          {saving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : saved ? (
            <span>✅ Guardado</span>
          ) : (
            <><Save size={18} /> Guardar cambios</>
          )}
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{metrics.totalMessages}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mensajes del bot</p>
          </div>
        </div>
        <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{metrics.totalAppts}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citas agendadas</p>
          </div>
        </div>
      </div>

      {/* Toggle principal */}
      <div className={`relative overflow-hidden rounded-[2rem] border-2 p-6 transition-all duration-500 ${
        isEnabled
          ? "bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-300 shadow-xl shadow-teal-500/10"
          : "bg-white border-slate-100 shadow-sm"
      }`}>
        {isEnabled && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-bl-[8rem] -z-10 blur-3xl" />
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              isEnabled
                ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-110"
                : "bg-slate-100 text-slate-400"
            }`}>
              <Power size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-black transition-colors ${isEnabled ? "text-teal-900" : "text-slate-900"}`}>
                {isEnabled ? "Bot Activo" : "Bot Inactivo"}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {isEnabled
                  ? "Los clientes pueden agendar citas por WhatsApp"
                  : "Activa el bot para empezar a recibir reservas automáticas"
                }
              </p>
            </div>
          </div>
          <label className="flex items-center cursor-pointer">
            <div className="relative shadow-sm rounded-full">
              <input
                type="checkbox"
                className="sr-only"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
              />
              <div className={`block w-14 h-8 rounded-full transition-colors duration-300 ${isEnabled ? "bg-teal-500" : "bg-slate-200"}`} />
              <div className={`absolute left-[3px] top-[3px] bg-white w-[26px] h-[26px] rounded-full transition-transform duration-300 shadow-sm ${isEnabled ? "translate-x-[24px]" : ""}`} />
            </div>
          </label>
        </div>
      </div>

      {/* Mensaje de bienvenida */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <MessageSquare size={20} className="text-purple-500" />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900">Mensaje de bienvenida</h3>
            <p className="text-xs text-slate-500 font-medium">Lo primero que verán tus clientes al escribir</p>
          </div>
        </div>
        <textarea
          value={welcomeMessage}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          className="w-full text-[15px] font-medium leading-relaxed h-36 p-4 border-2 border-slate-100 rounded-2xl outline-none resize-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-400 shadow-inner transition-all bg-white"
          placeholder="Escribe tu mensaje de bienvenida..."
        />
        <div className="mt-2 flex gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">💡 Incluye opciones numeradas como: 1️⃣ 2️⃣ 3️⃣ para que el cliente elija</span>
        </div>
      </div>

      {/* Servicios */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign size={20} className="text-blue-500" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">Servicios</h3>
              <p className="text-xs text-slate-500 font-medium">Los servicios que podrán elegir tus clientes</p>
            </div>
          </div>
          <button
            onClick={addService}
            className="flex items-center gap-1 bg-teal-50 text-teal-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-teal-500 hover:text-white transition-all"
          >
            <Plus size={16} /> Agregar
          </button>
        </div>

        <div className="space-y-3">
          {services.map((service, index) => (
            <div key={index} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={service.label}
                  onChange={(e) => updateService(index, "label", e.target.value)}
                  className="col-span-1 text-sm font-bold px-3 py-2.5 border-2 border-slate-100 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 bg-white"
                  placeholder="Nombre"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={service.price}
                    onChange={(e) => updateService(index, "price", parseInt(e.target.value) || 0)}
                    className="w-full text-sm font-bold px-3 py-2.5 pl-7 border-2 border-slate-100 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 bg-white"
                    placeholder="Precio"
                  />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={service.duration_min}
                    onChange={(e) => updateService(index, "duration_min", parseInt(e.target.value) || 60)}
                    className="w-full text-sm font-bold px-3 py-2.5 pr-10 border-2 border-slate-100 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 bg-white"
                    placeholder="Duración"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">min</span>
                </div>
              </div>
              <button
                onClick={() => removeService(index)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Horarios */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock size={20} className="text-amber-500" />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900">Horarios de atención</h3>
            <p className="text-xs text-slate-500 font-medium">Define cuándo pueden agendar citas</p>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(DAY_LABELS).map(([key, label]) => {
            const hours = businessHours[key];
            const isActive = !!hours;

            return (
              <div key={key} className={`flex items-center gap-4 rounded-2xl p-3 px-4 transition-all ${isActive ? "bg-slate-50 border border-slate-100" : "opacity-50"}`}>
                <label className="flex items-center cursor-pointer shrink-0">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isActive}
                      onChange={() => toggleDay(key)}
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${isActive ? "bg-teal-500" : "bg-slate-200"}`} />
                    <div className={`absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${isActive ? "translate-x-[16px]" : ""}`} />
                  </div>
                </label>
                <span className={`text-sm font-bold w-24 ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                  {label}
                </span>
                {isActive && hours && (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateHour(key, "open", e.target.value)}
                      className="text-sm font-bold px-3 py-2 border-2 border-slate-100 rounded-xl outline-none focus:border-teal-400 bg-white"
                    />
                    <span className="text-slate-400 font-bold text-sm">a</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateHour(key, "close", e.target.value)}
                      className="text-sm font-bold px-3 py-2 border-2 border-slate-100 rounded-xl outline-none focus:border-teal-400 bg-white"
                    />
                  </div>
                )}
                {!isActive && (
                  <span className="text-xs text-slate-400 font-medium">Cerrado</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Duración de slots */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-700">Duración por defecto de cada slot:</span>
            <div className="relative">
              <input
                type="number"
                value={slotDuration}
                onChange={(e) => setSlotDuration(parseInt(e.target.value) || 60)}
                className="w-24 text-sm font-bold px-3 py-2 pr-10 border-2 border-slate-100 rounded-xl outline-none focus:border-teal-400 bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plantilla de confirmación */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Sparkles size={20} className="text-green-500" />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900">Mensaje de confirmación</h3>
            <p className="text-xs text-slate-500 font-medium">Se envía al confirmar la cita</p>
          </div>
        </div>
        <textarea
          value={confirmationTemplate}
          onChange={(e) => setConfirmationTemplate(e.target.value)}
          className="w-full text-[15px] font-medium leading-relaxed h-36 p-4 border-2 border-slate-100 rounded-2xl outline-none resize-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-400 shadow-inner transition-all bg-white"
          placeholder="Escribe tu mensaje de confirmación..."
        />
        <div className="flex gap-2 flex-wrap mt-3">
          {[
            { label: "Servicio", tag: "{servicio}" },
            { label: "Fecha", tag: "{fecha}" },
            { label: "Hora", tag: "{hora}" },
          ].map(v => (
            <button
              key={v.tag}
              onClick={() => setConfirmationTemplate(prev => prev + v.tag)}
              className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-indigo-100/50 hover:border-indigo-200"
            >
              <Sparkles size={12} className="text-indigo-400" />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview del flujo */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 text-white shadow-2xl">
        <h3 className="font-black text-lg flex items-center gap-2 mb-4">
          <Bot size={20} className="text-teal-400" />
          Vista previa del flujo
        </h3>
        <div className="space-y-3 font-mono text-sm">
          <div className="flex gap-3">
            <span className="text-teal-400 shrink-0">Cliente:</span>
            <span className="text-slate-300">"Hola"</span>
          </div>
          <div className="flex gap-3">
            <span className="text-emerald-400 shrink-0">Bot:</span>
            <pre className="text-slate-300 whitespace-pre-wrap text-xs leading-relaxed">{welcomeMessage.slice(0, 200)}{welcomeMessage.length > 200 ? "..." : ""}</pre>
          </div>
          <div className="border-t border-slate-700 pt-3">
            <span className="text-teal-400">Cliente:</span> <span className="text-slate-300">"1"</span>
          </div>
          <div className="flex gap-3">
            <span className="text-emerald-400 shrink-0">Bot:</span>
            <div className="text-slate-300 text-xs">
              {services.length > 0 ? (
                <div>
                  <p className="mb-1">¿Qué servicio necesitas? 🐕</p>
                  {services.map((s, i) => (
                    <p key={i}>{i + 1}️⃣ {s.label || "Sin nombre"} — ${s.price}</p>
                  ))}
                </div>
              ) : (
                <p className="text-amber-400">⚠️ Agrega al menos un servicio</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botón guardar flotante (mobile) */}
      <div className="fixed bottom-20 left-0 right-0 md:hidden px-4 z-40">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all ${
            saved
              ? "bg-green-500 text-white shadow-green-500/30"
              : "bg-slate-900 text-white shadow-slate-900/30 hover:bg-teal-500"
          }`}
        >
          {saving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : saved ? (
            "✅ Cambios guardados"
          ) : (
            <><Save size={18} /> Guardar cambios</>
          )}
        </button>
      </div>
    </div>
  );
}
