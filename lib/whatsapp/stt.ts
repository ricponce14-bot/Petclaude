// lib/whatsapp/stt.ts
// Speech-to-text para notas de voz de WhatsApp (doc sección 7).
// 1. Descarga el audio (ogg/opus) de Meta por su media ID.
// 2. Lo transcribe con Whisper (OpenAI ya es dependencia del proyecto).
// 3. Devuelve el texto para alimentarlo al flujo de Mía / bot de clientes.

import OpenAI, { toFile } from "openai";
import { downloadMedia } from "@/lib/whatsapp/cloud-client";

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-000")) return null;
  if (!openaiClient) openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/** Deriva una extensión de archivo razonable a partir del mime type. */
function extFor(mime: string): string {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("wav")) return "wav";
  return "ogg";
}

/**
 * Descarga y transcribe una nota de voz. Devuelve el texto, o null si no se
 * pudo (STT no configurado, descarga fallida, o transcripción vacía).
 */
export async function transcribeAudio(mediaId: string): Promise<string | null> {
  const openai = getOpenAI();
  if (!openai) {
    console.warn("[STT] OPENAI_API_KEY no configurada — no se puede transcribir audio");
    return null;
  }

  const media = await downloadMedia(mediaId);
  if (!media) return null;

  try {
    const file = await toFile(
      Buffer.from(media.buffer),
      `audio.${extFor(media.mimeType)}`,
      { type: media.mimeType }
    );
    const result = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "es",
    });
    const text = (result.text || "").trim();
    return text || null;
  } catch (err: any) {
    console.error("[STT] Error al transcribir:", err.message);
    return null;
  }
}
