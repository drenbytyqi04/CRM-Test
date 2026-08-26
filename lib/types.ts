
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
 * Pjesa e parë e adresës, sipas rolit të atij që është i kyçur:
 *
 *   admin    -> /admin/terminet/1001
 *   manager  -> /menager/terminet/1001
 *   user     -> /user/terminet/1001
 *
 * Prefiksi është vetëm emërtim: ai NUK jep asnjë të drejtë. Lejet dalin
 * gjithmonë nga roli në tabelën `profiles`, dhe faqja e kthen përdoruesin
 * te prefiksi i rolit të vet nëse provon një tjetër.
 */
export const ROLE_PREFIXES = {
  user: "user",
  manager: "menager",
  admin: "admin",
} as const;

export type RolePrefix = (typeof ROLE_PREFIXES)[keyof typeof ROLE_PREFIXES];

export function rolePrefix(role: string): RolePrefix {
  return ROLE_PREFIXES[role as keyof typeof ROLE_PREFIXES] ?? "user";
}

/**
 * Adresa e faqes së një termini për atë që është i kyçur.
 *
 * Numri i shkurtër (`/admin/terminet/1001`). Nëse `supabase/nr.sql` nuk
 * është ekzekutuar ende, kolona `nr` mungon dhe përdoret `id`-ja e gjatë —
 * kështu asnjë lidhje nuk prishet gjatë kalimit.
 */
export function appointmentPath(
  t: { id: string; nr?: number | null },
  role: string
): string {
  return `/${rolePrefix(role)}/terminet/${t.nr ?? t.id}`;
}

const TZ = "Europe/Belgrade";

/**
 * Sa minuta larg orës botërore është Beogradi në atë çast (60 ose 120).
 * E llogarisim, sepse ora e verës e ndryshon dy herë në vit.
 */
function beogradOffsetMinutes(date: Date): number {
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
 * Beogradit: "2026-01-30T10:00".
 *
 * E llogarisim gjithmonë me orën e Beogradit (jo me orën e kompjuterit), që
 * serveri dhe shfletuesi të nxjerrin saktësisht të njëjtin tekst.
 */
export function toBeogradInput(iso: string): string {
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

/** E kundërta: "2026-01-30T10:00" (orë Beograd) -> data e plotë për ruajtje. */
export function fromBeogradInput(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(local)) return null;
  const sikurUTC = new Date(`${local.slice(0, 16)}:00Z`);
  if (Number.isNaN(sikurUTC.getTime())) return null;
  const offset = beogradOffsetMinutes(sikurUTC);
  return new Date(sikurUTC.getTime() - offset * 60000).toISOString();
}

/** Ora e parazgjedhur për një termin të ri: nesër në orën 10:00. */
export function defaultAppointmentSlot(): string {
  const neser = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return `${new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(
    neser
  )}T10:00`;
}

/** Data dhe ora e terminit për ta lexuar njeriu, në orën e Beogradit. */
export function formatBeograd(iso: string): string {
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

/** Data e sotme sipas orës së Beogradit, p.sh. "2026-08-26". */
export function todayInBeograd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
  }).format(new Date());
}

/**
 * Dita e Beogradit të cilës i përket ky çast, p.sh. "2026-08-26".
 *
 * Për grupimin e termineve sipas ditës: një termin i regjistruar në orën
 * 00:30 të Beogradit i përket asaj dite, jo asaj të djeshmes sipas orës
 * botërore.
 */
export function beogradDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(
    new Date(iso)
  );
}

/** Lista e `sa` ditëve të fundit, nga më e vjetra te sotmja. */
export function ditetEFundit(sa: number): string[] {
  const sot = new Date(`${todayInBeograd()}T12:00:00Z`);
  const lista: string[] = [];
  for (let i = sa - 1; i >= 0; i--) {
    const d = new Date(sot);
    d.setUTCDate(d.getUTCDate() - i);
    lista.push(d.toISOString().slice(0, 10));
  }
  return lista;
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
  return new Intl.DateTimeFormat("sq-AL", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "numeric",
  }).format(new Date(`${day}T12:00:00Z`));
}

/** Data më e shkurtër që lexohet ende: "25/8". Për boshtin e grafikëve. */
export function formatDayShort(day: string): string {
  const [, muaj, dita] = day.split("-");
  return `${Number(dita)}/${Number(muaj)}`;
}

/** Vetëm data, pa orë: "28 janar 1985". Për datëlindje e ngjashme. */
export function formatDateOnly(day: string): string {
  return new Date(`${day.slice(0, 10)}T12:00:00Z`).toLocaleDateString("sq-AL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Datë e lexueshme në shqip, me orën e Beogradit: "24 gusht 2026, 14:30".
 *
 * Zona kohore shkruhet shprehimisht. Pa të, ora dilte sipas kompjuterit që
 * e ndërton faqen — dhe serverat e Vercel-it punojnë me orën botërore (UTC),
 * pra ora e krijimit shfaqej 1–2 orë prapa.
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("sq-AL", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
