// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatear número de WhatsApp para mostrar
export function formatPhone(wa: string): string {
  // 521XXXXXXXXXX → +52 1 XXX XXX XXXX
  if (wa.length === 13 && wa.startsWith("52")) {
    return `+52 ${wa.slice(2, 3)} ${wa.slice(3, 6)} ${wa.slice(6, 9)} ${wa.slice(9)}`;
  }
  return wa;
}

// Link directo a WhatsApp con mensaje
export function waLink(phone: string, message?: string): string {
  const encoded = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${phone}${encoded}`;
}
