// lib/whatsapp/queue.ts
// Cola de eventos entrantes del webhook (doc sección 5).
// El webhook encola; el worker (process-queue) consume.

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export interface InboundEvent {
  phoneNumberId?: string;
  from: string;
  contactName?: string | null;
  messageId: string;
  type: string;
  raw: any;
}

export interface QueueRow {
  id: string;
  message_id: string | null;
  phone_number_id: string | null;
  from_phone: string;
  contact_name: string | null;
  msg_type: string | null;
  raw: any;
  status: string;
  attempts: number;
}

/**
 * Inserta un evento entrante. Idempotente: si message_id ya existe (reintento
 * de Meta), no duplica.
 */
export async function enqueueInbound(ev: InboundEvent): Promise<void> {
  const db = getSupabaseAdmin() as any;
  const { error } = await db
    .from("wa_inbound_queue")
    .upsert(
      {
        message_id: ev.messageId,
        phone_number_id: ev.phoneNumberId ?? null,
        from_phone: ev.from,
        contact_name: ev.contactName ?? null,
        msg_type: ev.type,
        raw: ev.raw,
        status: "pending",
      },
      { onConflict: "message_id", ignoreDuplicates: true }
    );
  if (error) {
    console.error("[Queue] Error al encolar:", error.message);
  }
}

/**
 * Toma un lote de eventos pendientes de forma atómica (los marca 'processing').
 */
export async function claimBatch(limit = 10): Promise<QueueRow[]> {
  const db = getSupabaseAdmin() as any;
  const { data, error } = await db.rpc("claim_inbound_batch", { p_limit: limit });
  if (error) {
    console.error("[Queue] Error en claim_inbound_batch:", error.message);
    return [];
  }
  return (data || []) as QueueRow[];
}

export async function markDone(id: string): Promise<void> {
  const db = getSupabaseAdmin() as any;
  await db
    .from("wa_inbound_queue")
    .update({ status: "done", processed_at: new Date().toISOString() })
    .eq("id", id);
}

export async function markError(id: string, message: string): Promise<void> {
  const db = getSupabaseAdmin() as any;
  await db
    .from("wa_inbound_queue")
    .update({ status: "error", error: message.slice(0, 1000), processed_at: new Date().toISOString() })
    .eq("id", id);
}

/**
 * Dispara el worker sin bloquear la respuesta a Meta (fire-and-forget).
 * En Vercel el worker también corre por cron cada minuto como respaldo.
 */
export function kickWorker(): void {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.CRON_SECRET;
  if (!base) return;
  try {
    // No await: dejamos que arranque en segundo plano.
    void fetch(`${base}/api/whatsapp/process-queue`, {
      method: "POST",
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    }).catch(() => {});
  } catch {
    // ignorar
  }
}
