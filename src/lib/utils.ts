import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateString(
  dateString?: string | Date,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
): string {
  if (!dateString) return "Fecha no especificada";
  try {
    const date = typeof dateString === 'string' ? parseDateString(dateString) : dateString;
    if(!date) return "Fecha inválida";
    return new Intl.DateTimeFormat('es-ES', options).format(date);
  } catch (error) {
    return "Fecha inválida";
  }
}

export function formatTimeString(timeString?: string): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (isNaN(h) || isNaN(m)) return timeString;
    const ampm = h >= 12 ? 'p.m.' : 'a.m.';
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes.padStart(2, '0')} ${ampm}`;
}

// Handles both 'YYYY-MM-DD' and 'DD/MM/YYYY' and date objects
export function parseDateString(dateString: string | Date): Date | null {
    if (!dateString) return null;

    if (dateString instanceof Date) {
        return dateString;
    }

    // Try ISO format YYYY-MM-DD first
    let parts = dateString.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
        const [year, month, day] = parts.map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (!isNaN(date.getTime())) return date;
    }
    
    // Try DD/MM/YYYY format
    parts = dateString.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (!isNaN(date.getTime())) return date;
    }
    
    // Fallback for other potential Date.parse compatible formats
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      // It might be off by one day due to timezone, so let's adjust to UTC
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() + userTimezoneOffset);
    }

    return null;
}

    