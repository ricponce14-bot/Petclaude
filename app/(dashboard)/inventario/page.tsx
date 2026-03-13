"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Plus, Search, Package, AlertTriangle, Trash2, 
  Edit2, Save, X, Loader2, ArrowUpDown
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  stock: number;
  min_stock: number;
  price: number;
  category: string;
}

export default function InventoryPage() {
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stock: 0,
    min_stock: 5,
    price: 0,
    category: "Insumos"
  });

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("name");
    
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    const tenantId = session?.user.app_metadata?.tenant_id || session?.user.user_metadata?.tenant_id;

    if (!tenantId) {
      alert("No se encontró tenant ID");
      setSaving(false);
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("inventory")
          .update(formData)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("inventory")
          .insert([{ ...formData, tenant_id: tenantId }]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ name: "", description: "", stock: 0, min_stock: 5, price: 0, category: "Insumos" });
      fetchInventory();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Borrar este producto del inventario?")) return;
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (!error) fetchInventory();
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      stock: item.stock,
      min_stock: item.min_stock,
      price: item.price,
      category: item.category || "Insumos"
    });
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="text-teal-500" />
            Inventario
          </h1>
          <p className="text-sm text-slate-500">Control de insumos y productos para tu estética.</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all active:scale-[0.98]"
        >
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Productos</p>
          <p className="text-3xl font-black text-slate-900">{items.length}</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm">
          <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1">
            <AlertTriangle size={14} /> Stock Bajo
          </p>
          <p className="text-3xl font-black text-amber-700">{items.filter(i => i.stock <= i.min_stock).length}</p>
        </div>
        <div className="bg-teal-50 p-6 rounded-3xl border border-teal-100 shadow-sm">
          <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-1">Valor Inventario</p>
          <p className="text-3xl font-black text-teal-700">
            ${items.reduce((acc, current) => acc + (current.price * current.stock), 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text"
              placeholder="Buscar productos o categorías..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-teal-500 mb-2" />
                    <p className="text-sm text-slate-400">Cargando inventario...</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.description}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-600 font-bold">{item.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 font-black ${item.stock <= item.min_stock ? "text-amber-600" : "text-slate-900"}`}>
                        {item.stock} 
                        {item.stock <= item.min_stock && <AlertTriangle size={14} />}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold">Min: {item.min_stock}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600">
                      ${item.price}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-teal-600 transition-colors"><Edit2 size={18} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">{editingItem ? "Editar Producto" : "Nuevo Producto"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 ml-1">Nombre</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-teal-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 ml-1">Descripción</label>
                  <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-teal-400 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 ml-1">Stock Actual</label>
                  <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 ml-1">Stock Mínimo</label>
                  <input type="number" required value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 ml-1">Precio Unitario</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 ml-1">Categoría</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-teal-400">
                    <option value="Insumos">Insumos</option>
                    <option value="Limpieza">Limpieza</option>
                    <option value="Corte">Corte</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-teal-500 transition-all flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={18} className="animate-spin" /> : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
