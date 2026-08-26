
/** Gjinia. */
export const GENDERS = [
  { value: "f", label: "Femër" },
  { value: "m", label: "Mashkull" },
] as const;

export function genderLabel(value: string | null): string {
  return GENDERS.find((g) => g.value === value)?.label ?? "—";
}

/** Statuset e një termini. Vetëm NJË prej tyre vlen njëherësh. */
export const APPOINTMENT_STATUSES = [
  { value: "open", label: "I hapur" },
  { value: "held", label: "U mbajt" },
  { value: "cancelled", label: "I anuluar" },
  { value: "not_reached", label: "Nuk u arrit" },
  { value: "refused", label: "S'deshi termin" },
  { value: "negative", label: "Negativ" },
  { value: "not_home", label: "S'ishte në shtëpi" },
  { value: "address_not_found", label: "Adresa s'u gjet" },
  { value: "advisor_failed", label: "S'u këshillua dot" },
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]["value"];

export function appointmentStatusLabel(value: string): string {
  return APPOINTMENT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

/** Ngjyrat e etiketës për statusin e terminit. */
export const APPOINTMENT_STATUS_CLASSES: Record<string, string> = {
  open: "bg-sky-100 text-sky-800 ring-sky-200",
  held: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
  not_reached: "bg-amber-100 text-amber-800 ring-amber-200",
  refused: "bg-rose-100 text-rose-800 ring-rose-200",
  negative: "bg-rose-100 text-rose-800 ring-rose-200",
  not_home: "bg-amber-100 text-amber-800 ring-amber-200",
  address_not_found: "bg-amber-100 text-amber-800 ring-amber-200",
  advisor_failed: "bg-slate-100 text-slate-600 ring-slate-200",
};

/** Një rresht i tabelës `appointments`. */
export type Appointment = {
  id: string;
  /**
   * Numri i shkurtër i terminit — ai që del në adresë: `/terminet/1001`.
   *
   * Është `null` vetëm nëse `supabase/nr.sql` nuk është ekzekutuar ende;
   * atëherë adresa bie prapa te `id`. Shih `appointmentPath()`.
   */
  nr: number | null;
  /** Kush e caktoi terminin. */
  user_id: string;

  // --- Personalia e personit që takohet ---
  name: string;
  customer_number: string | null;
  gender: string | null;
  nationality: string | null;
  birth_date: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  canton: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;

  // --- Të dhëna teknike ---
  call_center: string | null;
  current_insurance: string | null;
  call_date: string | null;
  scheduled_at: string;
  language: string | null;
  persons_count: number;
  status: AppointmentStatus;
  multi_year_contract: boolean;
  treatment: boolean;
  contracts_closed: number;
  family_details: string | null;
  current_treatment: string | null;
  treatment_type: string | null;
  medications: string | null;
  created_at: string;
  updated_at: string | null;
};

/** Kolonat e terminit që lexojmë. `*` e mban faqen të gjallë edhe nëse
 * ndonjë kolonë e re nuk është krijuar ende në bazë. */
export const APPOINTMENT_COLUMNS = "*";

/**
 * Adresa e faqes së një termini.
 *
 * Normalisht numri i shkurtër (`/terminet/1001`). Nëse `supabase/nr.sql`
 * nuk është ekzekutuar ende, kolona `nr` mungon dhe kthehet adresa e vjetër
 * me `id` — kështu asnjë lidhje nuk prishet gjatë kalimit.
 */
export function appointmentPath(t: { id: string; nr?: number | null }): string {
  return `/terminet/${t.nr ?? t.id}`;
}

const TZ = "Europe/Tirane";

/**
 * Sa minuta larg orës botërore është Tirana në atë çast (60 ose 120).
 * E llogarisim, sepse ora e verës e ndryshon dy herë në vit.
 */
function tiraneOffsetMinutes(date: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const sikurTeIshteUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return (sikurTeIshteUTC - date.getTime()) / 60000;
}

/**
 * Nga data e ruajtur në formën që pret fusha `datetime-local`, në orën e
 * Tiranës: "2026-01-30T10:00".
 *
 * E llogarisim gjithmonë me orën e Tiranës (jo me orën e kompjuterit), që
 * serveri dhe shfletuesi të nxjerrin saktësisht të njëjtin tekst.
 */
export function toTiraneInput(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(iso))
    .replace(" ", "T");
}

/** E kundërta: "2026-01-30T10:00" (orë Tirane) -> data e plotë për ruajtje. */
export function fromTiraneInput(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(local)) return null;
  const sikurUTC = new Date(`${local.slice(0, 16)}:00Z`);
  if (Number.isNaN(sikurUTC.getTime())) return null;
  const offset = tiraneOffsetMinutes(sikurUTC);
  return new Date(sikurUTC.getTime() - offset * 60000).toISOString();
}

/** Ora e parazgjedhur për një termin të ri: nesër në orën 10:00. */
export function defaultAppointmentSlot(): string {
  const neser = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return `${new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(
    neser
  )}T10:00`;
}

/** Data dhe ora e terminit për ta lexuar njeriu, në orën e Tiranës. */
export function formatTirane(iso: string): string {
  return new Intl.DateTimeFormat("sq-AL", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Një rresht i tabelës `notes`. */
export type Note = {
  id: string;
  appointment_id: string;
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
  role: "user" | "manager" | "admin";
  created_at: string;
};

/** Emrat e roleve në shqip. */
export const ROLE_LABELS: Record<string, string> = {
  user: "Përdorues",
  manager: "Menaxher",
  admin: "Admin",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

/** Ngjyrat e etiketës së rolit. */
export const ROLE_CLASSES: Record<string, string> = {
  user: "bg-slate-100 text-slate-600 ring-slate-200",
  manager: "bg-sky-100 text-sky-800 ring-sky-200",
  admin: "bg-slate-900 text-white ring-slate-900",
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

/** Vetëm data, pa orë: "28 janar 1985". Për datëlindje e ngjashme. */
export function formatDateOnly(day: string): string {
  return new Date(`${day.slice(0, 10)}T12:00:00Z`).toLocaleDateString("sq-AL", {
    day: "numeric",
    month: "long",
    year: "numeric",
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
