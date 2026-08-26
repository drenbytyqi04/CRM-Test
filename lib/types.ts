/** Statuset e mundshme të një klienti. Duhet të përputhen me `supabase/schema.sql`. */
export const STATUSES = [
  { value: "lead", label: "I ri" },
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Joaktiv" },
] as const;

export type Status = (typeof STATUSES)[number]["value"];

export function statusLabel(value: string): string {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}

/** Ngjyrat e etiketës për secilin status. */
export const STATUS_CLASSES: Record<string, string> = {
  lead: "bg-amber-100 text-amber-800 ring-amber-200",
  active: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  inactive: "bg-slate-100 text-slate-600 ring-slate-200",
};

/** Një rresht i tabelës `clients`. */
export type Client = {
  id: string;
  /** Kujt përdoruesi i përket ky klient. */
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: Status;
  created_at: string;
};

/** Një rresht i tabelës `notes`. */
export type Note = {
  id: string;
  client_id: string;
  /** Kush e shkroi shënimin. */
  user_id: string;
  body: string;
  created_at: string;
  /** Kur u ndryshua për herë të fundit; `null` nëse s'është prekur kurrë. */
  updated_at: string | null;
};

/** Një rresht i tabelës `profiles` (llogaria dhe roli i saj). */
export type Profile = {
  id: string;
  email: string | null;
  role: "user" | "admin";
  created_at: string;
};

/** Formati i përgjigjes që kthejnë format tona (Server Actions). */
export type FormState = {
  ok?: boolean;
  error?: string;
  /** Njoftim pozitiv për përdoruesin, p.sh. "kontrollo emailin". */
  message?: string;
};

/** Një rresht i tabelës `activity_days` (aktiviteti i një dite). */
export type ActivityDay = {
  user_id: string;
  day: string;
  active_seconds: number;
  last_seen_at: string;
};

/** Data e sotme sipas orës së Tiranës, p.sh. "2026-08-26". */
export function todayInTirane(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Tirane",
  }).format(new Date());
}

/** A është parë ky çast brenda `minutes` minutave të fundit? */
export function isRecent(iso: string | undefined | null, minutes = 5): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < minutes * 60 * 1000;
}

/** Sekondat në formë të lexueshme: "2h 15min", "45min", "—". */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) return seconds > 0 ? "< 1min" : "—";
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}min`;
}

/** Data e shkurtër e një dite, p.sh. "e mar 25/8". */
export function formatDayLabel(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  return d.toLocaleDateString("sq-AL", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  });
}

/** Datë e lexueshme në shqip, p.sh. "24 gusht 2026, 14:30". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("sq-AL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
