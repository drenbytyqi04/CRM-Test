import { Card, DayBars, StatTile } from "@/app/stats";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  APPOINTMENT_STATUS_CLASSES,
  ROLE_CLASSES,
  appointmentStatusLabel,
  beogradDay,
  ditetEFundit,
  formatDate,
  formatDayShort,
  formatDuration,
  roleLabel,
  rolePrefix,
  todayInBeograd,
  type ActivityDay,
  type Appointment,
  type Profile,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const DITE = 14;

/** Çfarë mund të bëjë secili rol. Teksti është i njëjti si te `roles.sql`. */
const LEJET: Record<string, { po: string[]; jo: string[] }> = {
  user: {
    po: ["Lexon të gjitha terminet e regjistruara", "Shkruan feedback te çdo termin"],
    jo: ["Cakton ose ndryshon termine", "Sheh përdoruesit dhe aktivitetin"],
  },
  manager: {
    po: [
      "Lexon të gjitha terminet e regjistruara",
      "Shkruan feedback te çdo termin",
      "Cakton termine të reja",
      "Ndryshon çdo termin",
    ],
    jo: ["Sheh përdoruesit dhe aktivitetin", "Ndryshon rolet"],
  },
  admin: {
    po: [
      "Lexon të gjitha terminet e regjistruara",
      "Shkruan dhe ndryshon çdo shënim",
      "Cakton dhe ndryshon çdo termin",
      "Sheh përdoruesit dhe kohën e tyre aktive",
    ],
    jo: ["Ndryshon rolet — kjo bëhet vetëm nga paneli i Supabase-it"],
  },
};

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const dite = ditetEFundit(DITE);
  const sot = todayInBeograd();

  const [profileResult, activityResult, terminetResult, notesResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .eq("id", user.id)
        .maybeSingle<Profile>(),
      supabase
        .from("activity_days")
        .select("user_id, day, active_seconds, last_seen_at")
        .eq("user_id", user.id)
        .gte("day", dite[0])
        .returns<ActivityDay[]>(),
      // Terminet e caktuara nga unë.
      supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .returns<Appointment[]>(),
      supabase
        .from("notes")
        .select("id, created_at")
        .eq("user_id", user.id)
        .returns<{ id: string; created_at: string }[]>(),
    ]);

  const profile = profileResult.data;
  const aktiviteti = activityResult.data ?? [];
  const terminet = terminetResult.data ?? [];
  const notes = notesResult.data ?? [];

  // ---------- Koha ----------
  const sekondaSot =
    aktiviteti.find((a) => a.day === sot)?.active_seconds ?? 0;
  const sekondaGjithsej = aktiviteti.reduce((s, a) => s + a.active_seconds, 0);
  const ditePune = aktiviteti.filter((a) => a.active_seconds >= 60).length;
  const mesatarja = ditePune > 0 ? Math.round(sekondaGjithsej / ditePune) : 0;

  const koha = dite.map((d) => ({
    dita: d,
    etiketa: formatDayShort(d),
    // Në grafik shfaqen minutat: orët do të ishin numra shumë të vegjël.
    vlera: Math.round(
      (aktiviteti.find((a) => a.day === d)?.active_seconds ?? 0) / 60
    ),
  }));

  // ---------- Puna ime ----------
  const kontrata = terminet.reduce((s, t) => s + t.contracts_closed, 0);
  const sipasStatusit = [
    ...terminet.reduce((m, t) => m.set(t.status, (m.get(t.status) ?? 0) + 1), new Map<string, number>()),
  ].sort((a, b) => b[1] - a[1]);
  const terminetSot = terminet.filter(
    (t) => beogradDay(t.scheduled_at) === sot
  ).length;

  const lejet = LEJET[user.role] ?? LEJET.user;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Profili im
          </h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
              ROLE_CLASSES[user.role] ?? ROLE_CLASSES.user
            }`}
          >
            {roleLabel(user.role)}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
      </header>

      {/* ---------- Llogaria ---------- */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          etiketa="Aktiv sot"
          vlera={formatDuration(sekondaSot)}
          nen="koha brenda CRM-së"
        />
        <StatTile
          etiketa={`${DITE} ditët e fundit`}
          vlera={formatDuration(sekondaGjithsej)}
          nen={`${ditePune} ditë pune`}
        />
        <StatTile
          etiketa="Mesatarja në ditë"
          vlera={formatDuration(mesatarja)}
          nen="vetëm ditët me punë"
        />
        <StatTile
          etiketa="Shënime të shkruara"
          vlera={notes.length}
          nen="feedback te terminet"
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card
          titull="Koha ime, ditë pas dite"
          nen={`Minuta brenda CRM-së, ${DITE} ditët e fundit.`}
        >
          <DayBars dite={koha} njesi="min" />
        </Card>

        <Card titull="Llogaria">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Emaili</dt>
              <dd className="mt-1 break-words text-slate-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Roli</dt>
              <dd className="mt-1 text-slate-900">{roleLabel(user.role)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Llogaria e hapur më</dt>
              <dd className="mt-1 text-slate-900">
                {profile ? formatDate(profile.created_at) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Adresa e termineve</dt>
              <dd className="mt-1 font-mono text-xs text-slate-900">
                /{rolePrefix(user.role)}/terminet/…
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            Passwordi nuk ruhet dot i lexueshëm askund, prandaj as këtu nuk
            shfaqet. Ndryshohet nga paneli i Supabase-it.
          </p>
        </Card>
      </div>

      {/* ---------- Puna ime ---------- */}
      {user.isManager && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <Card
            titull="Terminet e mia"
            nen="Ato që i kam caktuar unë."
          >
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-900">
                  {terminet.length}
                </p>
                <p className="text-sm text-slate-500">termine</p>
              </div>
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-900">
                  {kontrata}
                </p>
                <p className="text-sm text-slate-500">kontrata</p>
              </div>
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-900">
                  {terminetSot}
                </p>
                <p className="text-sm text-slate-500">sot</p>
              </div>
            </div>
          </Card>

          <Card titull="Sipas statusit" nen="Vetëm terminet e mia.">
            {sipasStatusit.length === 0 ? (
              <p className="text-sm text-slate-500">
                Ende s&apos;ke caktuar asnjë termin.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {sipasStatusit.map(([status, sa]) => (
                  <li
                    key={status}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      APPOINTMENT_STATUS_CLASSES[status] ??
                      APPOINTMENT_STATUS_CLASSES.cancelled
                    }`}
                  >
                    {appointmentStatusLabel(status)} · {sa}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* ---------- Lejet ---------- */}
      <Card
        titull="Çfarë mund të bësh"
        nen="Këto rregulla i zbaton vetë baza e të dhënave, jo faqja."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <ul className="space-y-2 text-sm">
            {lejet.po.map((v) => (
              <li key={v} className="flex gap-2 text-slate-700">
                <span aria-hidden className="text-emerald-600">
                  ✓
                </span>
                {v}
              </li>
            ))}
          </ul>
          <ul className="space-y-2 text-sm">
            {lejet.jo.map((v) => (
              <li key={v} className="flex gap-2 text-slate-400">
                <span aria-hidden>✕</span>
                {v}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </main>
  );
}
