// app/(dashboard)/mascotas/[id]/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import NewRecordModal from "@/components/mascotas/NewRecordModal";

export default async function MascotaPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const [{ data: pet }, { data: records }, { data: appointments }] = await Promise.all([
    supabase.from("pets").select("*, owners(name, whatsapp)").eq("id", params.id).single(),
    supabase.from("clinical_records").select("*").eq("pet_id", params.id).order("created_at", { ascending: false }),
    supabase.from("appointments").select("*").eq("pet_id", params.id).order("scheduled_at", { ascending: false }).limit(10),
  ]);

  if (!pet) notFound();

  const p = pet as any;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Pet header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-black shrink-0">
            {p.species === "cat" ? "G" : "P"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
              {p.temperament === "aggressive" && (
                <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
                  <AlertTriangle size={12} /> Agresivo
                </span>
              )}
              {p.temperament === "nervous" && (
                <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full font-bold">Nervioso</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {p.breed || "Raza no especificada"} · Dueño: {p.owners?.name}
            </p>
            {p.birthdate && (
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(p.birthdate), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            )}
          </div>
        </div>

        {p.allergies && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700"><strong>Alergias:</strong> {p.allergies}</p>
          </div>
        )}

        {p.notes && (
          <div className="mt-3 bg-gray-50 rounded-xl px-4 py-2.5">
            <p className="text-sm text-gray-600"><strong>Notas:</strong> {p.notes}</p>
          </div>
        )}
      </div>

      {/* Clinical timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Historial clínico</h2>
          <NewRecordModal petId={params.id} />
        </div>

        {!records?.length ? (
          <p className="text-center text-gray-400 py-10 text-sm">Sin registros clínicos aún</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-9 top-0 bottom-0 w-px bg-gray-100" />
            <ul className="py-4 space-y-1">
              {records.map((r: any) => (
                <li key={r.id} className="flex gap-4 px-5 py-2.5 relative">
                  {/* Dot */}
                  <div className="w-8 h-8 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center shrink-0 relative z-10">
                    <span className="text-xs font-black">
                      {r.type === "bath" ? "B" : r.type === "vaccine" ? "V" : r.type === "checkup" ? "C" : "S"}
                    </span>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 capitalize">{r.type}</span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(r.created_at), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                    {r.weight_kg && <p className="text-xs text-blue-500 mt-0.5">{r.weight_kg} kg</p>}
                    {r.products && <p className="text-xs text-purple-500 mt-0.5">Productos: {r.products}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
