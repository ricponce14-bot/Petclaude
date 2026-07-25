// lib/mia/tools.ts
// Definiciones de herramientas (function calling) para el asistente Mía.
// Doc sección 7. El bloque se marca con cache_control en el service para
// aprovechar prompt caching (se repite en cada llamada).

export const MIA_TOOLS = [
  {
    name: "crear_cita",
    description:
      "Agenda una nueva cita para un cliente en el negocio del dueño. Úsalo cuando el dueño pida agendar/registrar una cita a nombre de un cliente. Si falta el día es obligatorio preguntarlo antes de ejecutar.",
    input_schema: {
      type: "object",
      properties: {
        cliente: { type: "string", description: "Nombre del cliente" },
        cliente_telefono: {
          type: "string",
          description: "Teléfono del cliente en formato 521XXXXXXXXXX (opcional)",
        },
        dia: {
          type: "string",
          description: "Fecha de la cita en formato YYYY-MM-DD",
        },
        hora: {
          type: "string",
          description: "Hora de la cita en formato HH:MM 24h (opcional)",
        },
        servicio: { type: "string", description: "Servicio solicitado (opcional)" },
      },
      required: ["cliente", "dia"],
    },
  },
  {
    name: "consultar_disponibilidad",
    description:
      "Consulta los horarios ocupados de un día para saber la disponibilidad. Solo lectura: responde directo sin confirmar.",
    input_schema: {
      type: "object",
      properties: {
        dia: { type: "string", description: "Fecha a consultar en formato YYYY-MM-DD" },
      },
      required: ["dia"],
    },
  },
  {
    name: "registrar_gasto",
    description:
      "Registra un gasto del negocio. Si falta el monto es obligatorio preguntarlo antes de ejecutar.",
    input_schema: {
      type: "object",
      properties: {
        monto: { type: "number", description: "Monto del gasto en MXN" },
        concepto: { type: "string", description: "Concepto o descripción del gasto" },
        fecha: {
          type: "string",
          description: "Fecha del gasto YYYY-MM-DD (opcional, default hoy)",
        },
      },
      required: ["monto"],
    },
  },
  {
    name: "consultar_agenda_hoy",
    description:
      "Devuelve las citas agendadas para hoy en el negocio. Solo lectura: responde directo.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "consultar_gastos",
    description:
      "Devuelve los gastos registrados en un rango de fechas (o del día si no se especifica). Solo lectura.",
    input_schema: {
      type: "object",
      properties: {
        desde: { type: "string", description: "Fecha inicial YYYY-MM-DD (opcional)" },
        hasta: { type: "string", description: "Fecha final YYYY-MM-DD (opcional)" },
      },
    },
  },
] as const;

export type MiaToolName =
  | "crear_cita"
  | "consultar_disponibilidad"
  | "registrar_gasto"
  | "consultar_agenda_hoy"
  | "consultar_gastos";
