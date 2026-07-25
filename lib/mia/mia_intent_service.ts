// lib/mia/mia_intent_service.ts
// Asistente del dueño "Mía" — interpreta lenguaje natural (texto o audio
// transcrito) y ejecuta funciones contra el backend vía function calling.
// Doc sección 7. Modelo por defecto: Claude Haiku 4.5 (barato y suficiente);
// fallback a Sonnet para casos ambiguos. Usa prompt caching en el bloque de
// system + herramientas (se repite en cada llamada, reduce costo ~90%).

import Anthropic from "@anthropic-ai/sdk";
import { MIA_TOOLS, type MiaToolName } from "@/lib/mia/tools";
import {
  crearCita,
  consultarDisponibilidad,
  registrarGasto,
  consultarAgendaHoy,
  consultarGastos,
} from "@/lib/mia/actions";

const MODEL_DEFAULT = "claude-haiku-4-5";
const MODEL_FALLBACK = "claude-sonnet-5";
const MAX_TURNS = 6;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("[Mía] ANTHROPIC_API_KEY no configurada");
    client = new Anthropic({ apiKey });
  }
  return client;
}

function systemPrompt(): string {
  return `Eres Mía 🐾, la asistente por WhatsApp de Apúntame.mx para el DUEÑO de un negocio de servicios (estética, barbería, spa, clínica, etc.).
El dueño te escribe (o te manda notas de voz) para administrar su negocio en lenguaje natural.

Reglas:
- Para acciones que MODIFICAN datos (crear cita, registrar gasto): si falta un dato obligatorio, PREGÚNTALO antes de ejecutar la herramienta. No inventes datos.
- Para consultas de solo lectura (disponibilidad, agenda de hoy, gastos): responde directo, sin confirmar.
- Interpreta fechas relativas ("mañana", "el viernes") a formato YYYY-MM-DD según la fecha actual que se te indica.
- Responde en español mexicano, breve y claro, apto para WhatsApp. Usa la información que devuelven las herramientas; no la inventes.`;
}

/** Ejecuta la herramienta pedida por el modelo y devuelve el resultado en texto. */
async function runTool(
  name: MiaToolName,
  input: any,
  ctx: { tenantId: string; phone: string }
): Promise<string> {
  switch (name) {
    case "crear_cita":
      return crearCita(ctx.tenantId, input);
    case "consultar_disponibilidad":
      return consultarDisponibilidad(ctx.tenantId, input);
    case "registrar_gasto":
      return registrarGasto(ctx.tenantId, input, ctx.phone);
    case "consultar_agenda_hoy":
      return consultarAgendaHoy(ctx.tenantId);
    case "consultar_gastos":
      return consultarGastos(ctx.tenantId, input);
    default:
      return `Herramienta desconocida: ${name}`;
  }
}

interface RunMiaArgs {
  tenantId: string;
  phone: string;
  message: string;
}

async function runWithModel(model: string, args: RunMiaArgs): Promise<string> {
  const anthropic = getClient();
  const hoy = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Mexico_City",
  });

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `Fecha actual: ${hoy}.\n\nMensaje del dueño: ${args.message}` },
  ];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      // Prompt caching: system se marca ephemeral; tools rinden antes de
      // system, así que se cachean juntos.
      system: [
        { type: "text", text: systemPrompt(), cache_control: { type: "ephemeral" } },
      ],
      tools: MIA_TOOLS as any,
      messages,
    });

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await runTool(block.name as MiaToolName, block.input, {
            tenantId: args.tenantId,
            phone: args.phone,
          });
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Respuesta final: extraer texto.
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return text || "Listo. ¿Algo más? 🐾";
  }

  return "Se me complicó procesar eso. ¿Me lo repites de otra forma? 🐾";
}

/**
 * Punto de entrada del asistente Mía. Intenta con Haiku 4.5; si falla la
 * llamada al modelo, reintenta con Sonnet como fallback.
 */
export async function runMia(args: RunMiaArgs): Promise<string> {
  try {
    return await runWithModel(MODEL_DEFAULT, args);
  } catch (err: any) {
    console.error(`[Mía] Error con ${MODEL_DEFAULT}, reintentando con fallback:`, err?.message);
    try {
      return await runWithModel(MODEL_FALLBACK, args);
    } catch (err2: any) {
      console.error(`[Mía] Error con fallback ${MODEL_FALLBACK}:`, err2?.message);
      return "Tuve un problema técnico procesando tu mensaje 😅. Inténtalo de nuevo en un momento.";
    }
  }
}
