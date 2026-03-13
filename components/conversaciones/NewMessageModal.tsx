"use client";
import { useState } from "react";
import { X, Send, User, Loader2 } from "lucide-react";

interface NewMessageModalProps {
  onClose: () => void;
  onSuccess: (phone: string) => void;
}

export default function NewMessageModal({ onClose, onSuccess }: NewMessageModalProps) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !message.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ""), // Solo números
          body: message,
        }),
      });

      if (res.ok) {
        onSuccess(phone.replace(/\D/g, ""));
        onClose();
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "No se pudo enviar el mensaje"));
      }
    } catch (error: any) {
      alert("Error de conexión: " + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Send size={20} className="text-teal-500" />
            Nuevo Mensaje
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Teléfono (con clave de país)
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                required
                placeholder="Ej: 521234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Mensaje inicial
            </label>
            <textarea
              required
              rows={4}
              placeholder="Escribe el primer mensaje para este contacto..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-teal-400 transition-all resize-none placeholder:text-slate-400"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={sending || !phone.trim() || !message.trim()}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-teal-500 hover:shadow-lg hover:shadow-teal-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Enviar mensaje
                  <Send size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
