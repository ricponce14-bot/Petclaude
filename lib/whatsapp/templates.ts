// lib/whatsapp/templates.ts
// Envío de plantillas (templates) de WhatsApp — categoría utility (doc sección 8).
// Se usan para INICIAR conversación fuera de la ventana de 24h (recordatorios,
// resumen diario, etc.). Son GENÉRICAS con variables, NO una por negocio cliente.
//
// IMPORTANTE: los `name` deben coincidir con las plantillas aprobadas en Meta.
// El contenido real vive en Meta; aquí solo mandamos las variables.

import { sendTemplate, type SendResult } from "@/lib/whatsapp/cloud-client";

const LANG = process.env.WHATSAPP_TEMPLATE_LANG || "es_MX";

function bodyParams(...values: string[]) {
  return [{ type: "body", parameters: values.map((v) => ({ type: "text", text: v })) }];
}

/** Nombres de plantilla (deben existir aprobadas en Meta). Configurables por env. */
export const TEMPLATES = {
  confirmacion: process.env.WA_TMPL_CONFIRMACION || "confirmacion_cita",
  recordatorio: process.env.WA_TMPL_RECORDATORIO || "recordatorio_cita",
  cancelacion: process.env.WA_TMPL_CANCELACION || "cancelacion_cita",
  reagendado: process.env.WA_TMPL_REAGENDADO || "reagendado_cita",
  resumenDiario: process.env.WA_TMPL_RESUMEN || "resumen_diario",
};

// Hola {{1}}, tu cita en {{2}} quedó confirmada para el {{3}} a las {{4}}. Servicio: {{5}}.
export function sendConfirmacion(
  to: string,
  args: { cliente: string; negocio: string; fecha: string; hora: string; servicio: string }
): Promise<SendResult> {
  return sendTemplate(to, TEMPLATES.confirmacion, LANG, bodyParams(
    args.cliente, args.negocio, args.fecha, args.hora, args.servicio
  ));
}

// Hola {{1}}, te recordamos tu cita en {{2}} el {{3}} a las {{4}}.
export function sendRecordatorio(
  to: string,
  args: { cliente: string; negocio: string; fecha: string; hora: string }
): Promise<SendResult> {
  return sendTemplate(to, TEMPLATES.recordatorio, LANG, bodyParams(
    args.cliente, args.negocio, args.fecha, args.hora
  ));
}

export function sendCancelacion(
  to: string,
  args: { cliente: string; negocio: string; fecha: string }
): Promise<SendResult> {
  return sendTemplate(to, TEMPLATES.cancelacion, LANG, bodyParams(
    args.cliente, args.negocio, args.fecha
  ));
}

export function sendReagendado(
  to: string,
  args: { cliente: string; negocio: string; fecha: string; hora: string }
): Promise<SendResult> {
  return sendTemplate(to, TEMPLATES.reagendado, LANG, bodyParams(
    args.cliente, args.negocio, args.fecha, args.hora
  ));
}

// Resumen diario al dueño: Buenos días {{1}}, hoy tienes {{2}} citas.
export function sendResumenDiario(
  to: string,
  args: { negocio: string; totalCitas: string }
): Promise<SendResult> {
  return sendTemplate(to, TEMPLATES.resumenDiario, LANG, bodyParams(
    args.negocio, args.totalCitas
  ));
}
