// lib/whatsapp-bot/ai-intent-router.ts
// Clasificador de intents usando GPT-4o-mini
// Solo se activa en estados "inicio" y "finalizado" para entender lenguaje natural libre

import OpenAI from "openai";

export type Intent =
  | "agendar_cita"
  | "reagendar_cita"
  | "cancelar_cita"
  | "consultar_precios"
  | "menu"
  | "fuera_de_scope";

export interface IntentResult {
  intent: Intent;
  confidence: "high" | "low";
}

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.startsWith("sk-000")) {
      throw new Error("[AI Router] OPENAI_API_KEY no configurada");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Clasifica el intent de un mensaje de WhatsApp en lenguaje natural.
 * Retorna null si la API falla — el engine debe usar el flujo normal como fallback.
 */
export async function classifyIntent(
  message: string,
  businessName: string,
  services: { label: string }[]
): Promise<IntentResult | null> {
  try {
    const openai = getOpenAI();
    const serviceList = services.map((s) => s.label).join(", ");

    const systemPrompt = `Eres el clasificador de intents para el bot de WhatsApp de "${businessName}", una estética canina.
Los servicios disponibles son: ${serviceList}.

Clasifica el mensaje del cliente en UNO de estos intents:
- agendar_cita: quiere hacer una nueva cita (ej: "quiero llevar a mi perro", "puedo ir mañana", "tienen espacio esta semana", "agendar")
- reagendar_cita: quiere cambiar una cita existente (ej: "cambiar mi cita", "no puedo ese día", "mover mi cita", "reagendar")
- cancelar_cita: quiere cancelar una cita (ej: "cancelar mi cita", "ya no voy", "quiero cancelar")
- consultar_precios: pregunta por precios o servicios (ej: "cuánto cuesta", "qué servicios tienen", "precios", "cuánto cobran")
- menu: quiere ver el menú o ayuda general (ej: "hola", "buenas", "opciones", "menú", "ayuda", "inicio", "1", "2", "3", "4")
- fuera_de_scope: mensaje no relacionado con el negocio

Responde SOLO con un JSON válido en este formato exacto:
{"intent": "nombre_del_intent", "confidence": "high" o "low"}

Usa "low" si el mensaje es ambiguo. Nunca respondas con texto adicional.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 50,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { intent: string; confidence: string };
    if (!parsed?.intent || !parsed?.confidence) {
      console.warn("[AI Router] Respuesta malformada de OpenAI:", raw);
      return null;
    }
    const validIntents: Intent[] = [
      "agendar_cita",
      "reagendar_cita",
      "cancelar_cita",
      "consultar_precios",
      "menu",
      "fuera_de_scope",
    ];

    if (!validIntents.includes(parsed.intent as Intent)) {
      console.warn("[AI Router] Intent desconocido recibido:", parsed.intent);
      return null;
    }

    return {
      intent: parsed.intent as Intent,
      confidence: parsed.confidence === "high" ? "high" : "low",
    };
  } catch (err: any) {
    console.error("[AI Router] Error al clasificar intent:", err.message);
    return null;
  }
}

// ============================================================
// Extractor de datos de registro (onboarding)
// ============================================================

export interface RegistrationExtract {
  owner_name: string | null;
  pet_name: string | null;
  breed: string | null;
  size: string | null;
}

/**
 * Extrae datos de registro (nombre del dueño y/o datos de la mascota)
 * de un mensaje en lenguaje natural.
 * - step "nombre": espera nombre del dueño (y opcionalmente datos de mascota)
 * - step "mascota": espera datos de la mascota (nombre, raza, tamaño)
 */
export async function extractRegistrationData(
  message: string,
  step: "nombre" | "mascota",
  ownerName?: string
): Promise<RegistrationExtract | null> {
  try {
    const openai = getOpenAI();

    const systemPrompt =
      step === "nombre"
        ? `Eres un extractor de datos para una estética canina en México.
El cliente respondió al mensaje "¿Cuál es tu nombre?".
Extrae los siguientes campos del mensaje:
- owner_name: El nombre del dueño (REQUERIDO — extrae solo el nombre propio)
- pet_name: El nombre de la mascota (si lo mencionó, si no es null)
- breed: La raza de la mascota (si la mencionó, si no es null)
- size: El tamaño — SOLO "pequeño", "mediano" o "grande" (si lo mencionó o puedes inferirlo de la raza, si no es null)

Responde SOLO con JSON válido sin texto adicional:
{"owner_name": "...", "pet_name": null, "breed": null, "size": null}`
        : `Eres un extractor de datos para una estética canina en México.
El dueño se llama "${ownerName ?? ""}". El cliente respondió al mensaje "¿Cómo se llama tu mascota, cuál es su raza y tamaño?".
Extrae los siguientes campos del mensaje:
- pet_name: El nombre de la mascota (REQUERIDO)
- breed: La raza (si la mencionó, si no es null)
- size: El tamaño — SOLO "pequeño", "mediano" o "grande" (si lo mencionó o puedes inferirlo de la raza, si no es null)

Responde SOLO con JSON válido sin texto adicional:
{"owner_name": null, "pet_name": "...", "breed": null, "size": null}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 100,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as RegistrationExtract;
    return {
      owner_name: parsed.owner_name || null,
      pet_name: parsed.pet_name || null,
      breed: parsed.breed || null,
      size: parsed.size || null,
    };
  } catch (err: any) {
    console.error("[AI Router] Error al extraer datos de registro:", err.message);
    return null;
  }
}
