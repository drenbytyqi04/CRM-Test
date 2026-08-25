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
  body: string;
  created_at: string;
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
