"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DollarSign, Plus, Trash2, Filter, TrendingDown, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import NewExpenseModal from "@/components/gastos/NewExpenseModal";

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    supplies: { label: "Insumos", icon: "IN", color: "text-blue-700", bg: "bg-blue-50" },
    rent: { label: "Renta", icon: "RE", color: "text-purple-700", bg: "bg-purple-50" },
    payroll: { label: "Nomina", icon: "NM", color: "text-green-700", bg: "bg-green-50" },
    utilities: { label: "Servicios", icon: "SV", color: "text-yellow-700", bg: "bg-yellow-50" },
    veterinary: { label: "Veterinario", icon: "VT", color: "text-rose-700", bg: "bg-rose-50" },
    other: { label: "Otro", icon: "OT", color: "text-slate-700", bg: "bg-slate-50" },
};

interface Expense {
    id: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    created_at: string;
}

export default function GastosPage() {
    const supabase = createClient();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [filterCategory, setFilterCategory] = useState<string>("all");

    const fetchExpenses = async () => {
        setLoading(true);
        const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
        const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

        let query = supabase
            .from("expenses")
            .select("*")
            .gte("date", start)
            .lte("date", end)
            .order("date", { ascending: false });

        if (filterCategory !== "all") {
            query = query.eq("category", filterCategory);
        }

        const { data } = await query;
        setExpenses((data as Expense[]) || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchExpenses();
    }, [currentMonth, filterCategory]);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este gasto?")) return;
        await supabase.from("expenses").delete().eq("id", id);
        fetchExpenses();
    };

    // Calcular totales por categoría
    const totalByCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
        return acc;
    }, {} as Record<string, number>);

    const grandTotal = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);

    // Encontrar categoría con mayor gasto
    const topCategory = Object.entries(totalByCategory).sort(([, a], [, b]) => b - a)[0];

    return (
        <div className="p-6 max-w-5xl mx-auto pb-24 md:pb-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <DollarSign className="text-emerald-600" size={32} /> Control de Gastos
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                        Lleva el control financiero de tu estética canina.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-soft-purple hover:bg-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                    <Plus size={18} /> Nuevo gasto
                </button>
            </div>

            {/* Month Selector + Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                        ←
                    </button>
                    <span className="font-black text-slate-800 text-sm capitalize min-w-[150px] text-center">
                        {format(currentMonth, "MMMM yyyy", { locale: es })}
                    </span>
                    <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                        →
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-400" />
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                    >
                        <option value="all">Todas las categorías</option>
                        {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full opacity-60" />
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total del mes</p>
                    <p className="text-2xl font-black text-emerald-600">${grandTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Registros</p>
                    <p className="text-2xl font-black text-slate-700">{expenses.length}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Mayor gasto</p>
                    <p className="text-lg font-black text-slate-700">
                        {topCategory ? `${CATEGORY_CONFIG[topCategory[0]]?.icon} ${CATEGORY_CONFIG[topCategory[0]]?.label}` : "—"}
                    </p>
                </div>
                <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Promedio/gasto</p>
                    <p className="text-2xl font-black text-slate-700">
                        ${expenses.length ? (grandTotal / expenses.length).toFixed(0) : "0"}
                    </p>
                </div>
            </div>

            {/* Category Breakdown */}
            {Object.keys(totalByCategory).length > 0 && (
                <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-sm">
                    <h3 className="font-black text-slate-800 text-sm mb-4">Desglose por categoría</h3>
                    <div className="space-y-3">
                        {Object.entries(totalByCategory)
                            .sort(([, a], [, b]) => b - a)
                            .map(([cat, total]) => {
                                const config = CATEGORY_CONFIG[cat];
                                const pct = grandTotal ? (total / grandTotal) * 100 : 0;
                                return (
                                    <div key={cat} className="flex items-center gap-3">
                                        <span className="text-xs font-black w-8 text-center">{config?.icon}</span>
                                        <span className="text-sm font-bold text-slate-700 w-24">{config?.label}</span>
                                        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-black text-slate-800 w-28 text-right">
                                            ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Expenses List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : expenses.length === 0 ? (
                <div className="text-center py-20 glass rounded-[2rem]">
                    <DollarSign size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold text-lg">No hay gastos registrados este mes</p>
                    <button onClick={() => setShowModal(true)} className="mt-4 text-teal-600 text-sm font-bold hover:underline">
                        + Registrar primer gasto
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {expenses.map(exp => {
                        const config = CATEGORY_CONFIG[exp.category];
                        return (
                            <div key={exp.id} className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-soft-teal hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 group">
                                <div className={`w-12 h-12 ${config?.bg || "bg-slate-50"} rounded-xl flex items-center justify-center text-xs font-black shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform ${config?.color || "text-slate-500"}`}>
                                    {config?.icon || "OT"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-black text-slate-900 text-sm">{exp.description}</span>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${config?.bg} ${config?.color}`}>
                                            {config?.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">
                                        {format(new Date(exp.date + "T12:00:00"), "d 'de' MMMM, yyyy", { locale: es })}
                                    </p>
                                </div>
                                <span className="text-lg font-black text-slate-800 shrink-0">
                                    ${Number(exp.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </span>
                                <button
                                    onClick={() => handleDelete(exp.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <NewExpenseModal
                    onClose={() => setShowModal(false)}
                    onCreated={fetchExpenses}
                />
            )}
        </div>
    );
}
