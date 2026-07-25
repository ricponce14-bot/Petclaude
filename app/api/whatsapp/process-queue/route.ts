// app/api/whatsapp/process-queue/route.ts
// Worker que consume la cola de eventos ENTRANTES (doc sección 5).
// Se invoca de dos formas:
//   1. Fire-and-forget desde el webhook (kickWorker) para latencia baja.
//   2. Vercel Cron cada minuto como respaldo (por si algún kick se pierde).
//
// Aquí SÍ ocurre el trabajo pesado: STT, LLM (Mía), envío de respuestas.
// (La versión anterior enviaba salientes por Evolution API — eliminado.)

import { NextResponse } from "next/server";
import { claimBatch, markDone, markError } from "@/lib/whatsapp/queue";
import { handleInboundMessage } from "@/lib/whatsapp/router";

export const runtime = "nodejs";
export const maxDuration = 300; // requiere Fluid Compute en Vercel (doc sección 10)

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // sin secret configurado, permitir (dev)
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

async function run(): Promise<{ processed: number; errors: number }> {
  const batch = await claimBatch(10);
  let processed = 0;
  let errors = 0;

  for (const row of batch) {
    try {
      await handleInboundMessage(row);
      await markDone(row.id);
      processed++;
    } catch (err: any) {
      console.error(`[Worker] Error procesando ${row.id}:`, err?.message);
      await markError(row.id, err?.message || "unknown");
      errors++;
    }
  }
  return { processed, errors };
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await run();
  return NextResponse.json({ ok: true, ...result });
}

// Vercel Cron usa GET
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await run();
  return NextResponse.json({ ok: true, ...result });
}
