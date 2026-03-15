// lib/supabase/types.ts
// Tipos generados manualmente del schema — puedes reemplazar con: supabase gen types typescript

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
export type AppointmentType   = "bath" | "haircut" | "bath_haircut" | "vaccine" | "checkup" | "other";
export type WaMessageType     = "reminder" | "winback" | "birthday" | "manual" | "bot_reply" | "bot_incoming";
export type WaStatus          = "pending" | "sent" | "failed";
export type ChatState         = "inicio" | "seleccionar_servicio" | "seleccionar_fecha" | "seleccionar_hora" | "confirmar" | "finalizado" | "esperando_confirmacion" | "reagendar_seleccionar" | "reagendar_fecha" | "reagendar_hora" | "onboarding_nombre" | "onboarding_mascota";

export interface Tenant {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  plan: "trial" | "active" | "cancelled";
  trial_ends_at: string;
  created_at: string;
}

export interface Owner {
  id: string;
  tenant_id: string;
  name: string;
  whatsapp: string;
  notes: string | null;
  created_at: string;
  pets?: Pet[];
}

export interface Pet {
  id: string;
  tenant_id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  birthdate: string | null;
  species: "dog" | "cat" | "other";
  allergies: string | null;
  temperament: "friendly" | "nervous" | "aggressive";
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  owner?: Owner;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  pet_id: string;
  owner_id: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduled_at: string;
  duration_min: number;
  price: number | null;
  notes: string | null;
  reminder_sent: boolean;
  created_at: string;
  pet?: Pet;
  owner?: Owner;
}

export interface ClinicalRecord {
  id: string;
  tenant_id: string;
  pet_id: string;
  appt_id: string | null;
  type: string;
  description: string | null;
  weight_kg: number | null;
  products: string | null;
  created_at: string;
}

export interface WaMessage {
  id: string;
  tenant_id: string;
  owner_id: string | null;
  pet_id: string | null;
  appt_id: string | null;
  type: WaMessageType;
  phone: string;
  body: string;
  media_url: string | null;
  status: WaStatus;
  direction: "inbound" | "outbound";
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

export interface WaSession {
  id: string;
  tenant_id: string;
  instance: string;
  status: "connected" | "disconnected" | "qr_needed";
  qr_code: string | null;
  updated_at: string;
}

// ============================================================
// Bot conversacional
// ============================================================

export interface BotService {
  key: string;
  label: string;
  duration_min: number;
  price: number;
}

export interface BotDayHours {
  open: string;  // "09:00"
  close: string; // "18:00"
}

export type BotBusinessHours = Record<string, BotDayHours | null>;

export interface BotConfig {
  id: string;
  tenant_id: string;
  is_enabled: boolean;
  welcome_message: string;
  services: BotService[];
  business_hours: BotBusinessHours;
  slot_duration_min: number;
  confirmation_template: string;
  price_list_message: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsappChatSession {
  id: string;
  tenant_id: string;
  phone: string;
  owner_id: string | null;
  state: ChatState;
  selected_service: string | null;
  selected_date: string | null;
  selected_time: string | null;
  selected_pet_id: string | null;
  last_message_at: string;
  expires_at: string;
  created_at: string;
}

// Supabase Database shape (para genéricos del cliente)
export interface Database {
  public: {
    Tables: {
      tenants:                  { Row: Tenant;               Insert: Omit<Tenant, "id" | "created_at">;               Update: Partial<Tenant> };
      owners:                   { Row: Owner;                Insert: Omit<Owner, "id" | "created_at">;                Update: Partial<Owner> };
      pets:                     { Row: Pet;                  Insert: Omit<Pet, "id" | "created_at">;                  Update: Partial<Pet> };
      appointments:             { Row: Appointment;          Insert: Omit<Appointment, "id" | "created_at">;          Update: Partial<Appointment> };
      clinical_records:         { Row: ClinicalRecord;       Insert: Omit<ClinicalRecord, "id" | "created_at">;      Update: Partial<ClinicalRecord> };
      wa_messages:              { Row: WaMessage;            Insert: Omit<WaMessage, "id" | "created_at">;           Update: Partial<WaMessage> };
      wa_sessions:              { Row: WaSession;            Insert: Omit<WaSession, "id">;                          Update: Partial<WaSession> };
      bot_config:               { Row: BotConfig;            Insert: Omit<BotConfig, "id" | "created_at">;           Update: Partial<BotConfig> };
      whatsapp_chat_sessions:   { Row: WhatsappChatSession;  Insert: Omit<WhatsappChatSession, "id" | "created_at">; Update: Partial<WhatsappChatSession> };
    };
  };
}
