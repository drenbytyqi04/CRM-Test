import UserForm from "./user-form";
import DeleteUser from "./delete-user";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import {
  ROLE_CLASSES,
  formatDate,
  formatDuration,
  isRecent,
  roleLabel,
  todayInBeograd,
  type ActivityDay,
  type Profile,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/** Një rresht i `puna_per_person()`: sa ka bërë secili. */
type PunaEPersonit = { user_id: string; terminet: number; shenimet: number };

/** Faqja e administratorit: të gjithë përdoruesit dhe sa të dhëna ka secili. */
export default async function AdminPage() {
  // Kush s'është admin, dërgohet te faqja kryesore.
  // Vetëm admini e hap këtë faqe.
  const { t, lang, locale } = await getI18n();
  const admin = await requireAdmin();
  const supabase = await createClient();

  // Dita e sotme sipas orës së Beogradit, si te funksioni në bazë.
  const sot = todayInBeograd();

  const [profilesResult, punaResult, activityResult] =
    await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, role, active, created_at")
      .order("created_at", { ascending: true })
      .returns<Profile[]>(),
    // Numërimin e bën baza (`supabase/numrat.sql`): një rresht për person, në
    // vend të TË GJITHA termineve dhe TË GJITHA shënimeve. Ashtu si ishte,
    // mbi 1000 rreshta Supabase i priste në heshtje dhe numrat dilnin të
    // gabuar — më të vegjël se e vërteta, pa asnjë shenjë.
    supabase.rpc("puna_per_person"),
    supabase
      .from("activity_days")
      .select("user_id, day, active_seconds, last_seen_at")
      .eq("day", sot)
      .returns<ActivityDay[]>(),
  ]);

  const profiles = profilesResult.data ?? [];

  const termineCounts = new Map<string, number>();
  const noteCounts = new Map<string, number>();
  // Tipi vjen nga vetë funksioni te baza; këtu thuhet shprehimisht, sepse
  // tipat e Supabase-it nuk e njohin një funksion që s'është te skema e tyre.
  const puna = (punaResult.data ?? []) as PunaEPersonit[];
  for (const rresht of puna) {
    termineCounts.set(rresht.user_id, Number(rresht.terminet));
    noteCounts.set(rresht.user_id, Number(rresht.shenimet));
  }

  // Aktiviteti i sotëm: sa kohë dhe kur u pa së fundi.
  const sotSekonda = new Map<string, number>();
  const paSeFundi = new Map<string, string>();
  for (const rresht of activityResult.data ?? []) {
    sotSekonda.set(rresht.user_id, rresht.active_seconds);
    paSeFundi.set(rresht.user_id, rresht.last_seen_at);
  }
  const eshteAktiv = (userId: string) => isRecent(paSeFundi.get(userId));

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      {/* Lidhjet, emaili dhe "Dil" rrinë te menyja anash. */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {t.usersTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t.usersSubtitle}
        </p>
      </header>

      <UserForm lang={lang} />

      {profilesResult.error && (
        <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {t.usersLoadError}: {profilesResult.error.message}
        </p>
      )}

      {/* Pa këtë, mungesa e funksionit do të dukej si «të gjithë kanë zero» —
          pikërisht numri i gabuar që u desh të hiqej. */}
      {punaResult.error && (
        <p className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          {t.usersCountsMissing}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="p-4 font-medium">{t.usersColEmail}</th>
              <th className="p-4 font-medium">{t.usersColRole}</th>
              <th className="p-4 font-medium">{t.usersColActiveToday}</th>
              <th className="p-4 font-medium">{t.usersColAppointments}</th>
              <th className="p-4 font-medium">{t.usersColNotes}</th>
              <th className="p-4 font-medium">{t.usersColRegistered}</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="p-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        eshteAktiv(profile.id) ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                      title={eshteAktiv(profile.id) ? t.usersActiveNow : t.usersNotActive}
                    />
                    <span
                      className={
                        profile.active ? "text-slate-900" : "text-slate-400"
                      }
                    >
                      {profile.email ?? "—"}
                    </span>
                    {!profile.active && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {t.usersNoAccess}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      ROLE_CLASSES[profile.role] ?? ROLE_CLASSES.user
                    }`}
                  >
                    {roleLabel(profile.role, t)}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap text-slate-600">
                  {formatDuration(sotSekonda.get(profile.id) ?? 0)}
                </td>
                <td className="p-4 text-slate-600">
                  {termineCounts.get(profile.id) ?? 0}
                </td>
                <td className="p-4 text-slate-600">
                  {noteCounts.get(profile.id) ?? 0}
                </td>
                <td className="p-4 text-slate-500">
                  {formatDate(profile.created_at, locale)}
                </td>
                <td className="p-4 text-right align-top">
                  <DeleteUser
                    userId={profile.id}
                    email={profile.email ?? "—"}
                    termine={termineCounts.get(profile.id) ?? 0}
                    shenime={noteCounts.get(profile.id) ?? 0}
                    vetja={profile.id === admin.id}
                    lang={lang}
                    aktiv={profile.active}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {t.usersKeepDataNote}
      </p>

      <p className="mt-3 text-sm text-slate-500">
        {t.usersRolesNote}{" "}
        <code className="rounded bg-slate-100 px-1">user</code>,{" "}
        <code className="rounded bg-slate-100 px-1">manager</code>,{" "}
        <code className="rounded bg-slate-100 px-1">admin</code>.
      </p>
    </main>
  );
}
