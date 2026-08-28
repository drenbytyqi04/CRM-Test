import { Card, DayBars, StatTile } from "@/app/stats";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import type { Dict } from "@/lib/i18n";
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

/** Çfarë mund të bëjë secili rol. I njëjti kuptim si te `roles.sql`. */
function lejet(role: string, t: Dict): { po: string[]; jo: string[] } {
  if (role === "admin") {
    return {
      po: [t.permReadAll, t.permEditAnyNote, t.permEditAppointments, t.permSeeUsers],
      jo: [t.permNoChangeRolesAdmin],
    };
  }
  if (role === "manager") {
    return {
      po: [
        t.permReadAll,
        t.permWriteNotes,
        t.permCreateAppointments,
        t.permEditAppointments,
        t.permDeleteAppointments,
      ],
      jo: [t.permNoSeeUsers, t.permNoChangeRoles],
    };
  }
  return {
    po: [t.permReadAll, t.permWriteNotes],
    jo: [t.permNoCreateAppointments, t.permNoSeeUsers],
  };
}

export default async function ProfilePage() {
  const { t, locale } = await getI18n();
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

  const lejeta = lejet(user.role, t);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {t.profileTitle}
          </h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
              ROLE_CLASSES[user.role] ?? ROLE_CLASSES.user
            }`}
          >
            {roleLabel(user.role, t)}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
      </header>

      {/* ---------- Llogaria ---------- */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          etiketa={t.profileActiveToday}
          vlera={formatDuration(sekondaSot)}
          nen={t.profileActiveTodayHint}
        />
        <StatTile
          etiketa={t.profileLastDays(DITE)}
          vlera={formatDuration(sekondaGjithsej)}
          nen={t.profileWorkDays(ditePune)}
        />
        <StatTile
          etiketa={t.profileAverage}
          vlera={formatDuration(mesatarja)}
          nen={t.profileAverageHint}
        />
        <StatTile
          etiketa={t.profileNotesWritten}
          vlera={notes.length}
          nen={t.profileNotesHint}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card
          titull={t.profileTimeChart}
          nen={t.profileTimeChartHint(DITE)}
        >
          <DayBars dite={koha} njesi="min" />
        </Card>

        <Card titull={t.profileAccount}>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">{t.profileEmail}</dt>
              <dd className="mt-1 break-words text-slate-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t.profileRole}</dt>
              <dd className="mt-1 text-slate-900">{roleLabel(user.role, t)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t.profileCreatedAt}</dt>
              <dd className="mt-1 text-slate-900">
                {profile ? formatDate(profile.created_at, locale) : t.noValue}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">{t.profileUrl}</dt>
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
            titull={t.profileMyAppointments}
            nen={t.profileMyAppointmentsHint}
          >
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-900">
                  {terminet.length}
                </p>
                <p className="text-sm text-slate-500">{t.profileAppointments}</p>
              </div>
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-900">
                  {kontrata}
                </p>
                <p className="text-sm text-slate-500">{t.profileContracts}</p>
              </div>
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-900">
                  {terminetSot}
                </p>
                <p className="text-sm text-slate-500">{t.profileToday}</p>
              </div>
            </div>
          </Card>

          <Card titull={t.profileByStatus} nen={t.profileByStatusHint}>
            {sipasStatusit.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t.profileNoAppointments}
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
                    {appointmentStatusLabel(status, t)} · {sa}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* ---------- Lejet ---------- */}
      <Card
        titull={t.profilePermissions}
        nen={t.profilePermissionsHint}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <ul className="space-y-2 text-sm">
            {lejeta.po.map((v) => (
              <li key={v} className="flex gap-2 text-slate-700">
                <span aria-hidden className="text-emerald-600">
                  ✓
                </span>
                {v}
              </li>
            ))}
          </ul>
          <ul className="space-y-2 text-sm">
            {lejeta.jo.map((v) => (
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
