"use client";
import { useState } from "react";
import { X, Loader2, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
    { value: "supplies", label: "🧴 Insumos (shampoos, productos)" },
    { value: "rent", label: "🏠 Renta del local" },
    { value: "payroll", label: "👥 Nómina / Sueldos" },
    { value: "utilities", label: "⚡ Servicios (luz, agua, internet)" },
    { value: "veterinary", label: "🩺 Gastos veterinarios" },
    { value: "other", label: "📦 Otro" },
];

interface NewExpenseModalProps {
    onClose: () => void;
    onCreated: () => void;
}

export default function NewExpenseModal({ onClose, onCreated }: NewExpenseModalProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        category: "supplies",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const tenantId = session?.user?.app_metadata?.tenant_id || session?.user?.user_metadata?.tenant_id;

            if (!tenantId) {
                throw new Error("No se encontró tu veterinaria. Re-ingresa por favor.");
            }

            const { error: insertError } = await supabase.from("expenses").insert({
                tenant_id: tenantId,
                category: formData.category,
                description: formData.description,
                amount: parseFloat(formData.amount),
                date: formData.date,
            } as any);

            if (insertError) throw insertError;

            onCreated();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <DollarSign size={20} className="text-emerald-500" /> Registrar gasto
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Categoría *</label>
                        <select
                            required
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Descripción *</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ej. Compra de shampoo para perros"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Monto (MXN) *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Fecha *</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-70 shadow-sm"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : "Guardar gasto"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
