import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
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

/** Faqja e administratorit: të gjithë përdoruesit dhe sa të dhëna ka secili. */
export default async function AdminPage() {
  // Kush s'është admin, dërgohet te faqja kryesore.
  // Vetëm admini e hap këtë faqe.
  await requireAdmin();
  const supabase = await createClient();

  // Dita e sotme sipas orës së Beogradit, si te funksioni në bazë.
  const sot = todayInBeograd();

  const [profilesResult, terminetResult, notesResult, activityResult] =
    await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: true })
      .returns<Profile[]>(),
    supabase
      .from("appointments")
      .select("user_id")
      .returns<{ user_id: string }[]>(),
    supabase.from("notes").select("user_id").returns<{ user_id: string }[]>(),
    supabase
      .from("activity_days")
      .select("user_id, day, active_seconds, last_seen_at")
      .eq("day", sot)
      .returns<ActivityDay[]>(),
  ]);

  const profiles = profilesResult.data ?? [];

  const countBy = (rows: { user_id: string }[] | null) => {
    const map = new Map<string, number>();
    for (const row of rows ?? []) {
      map.set(row.user_id, (map.get(row.user_id) ?? 0) + 1);
    }
    return map;
  };

  const termineCounts = countBy(terminetResult.data);
  const noteCounts = countBy(notesResult.data);

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
          Përdoruesit
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Të gjitha llogaritë e regjistruara në sistem.
        </p>
      </header>

      {profilesResult.error && (
        <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Nuk u lexuan dot përdoruesit: {profilesResult.error.message}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="p-4 font-medium">Emaili</th>
              <th className="p-4 font-medium">Roli</th>
              <th className="p-4 font-medium">Aktiv sot</th>
              <th className="p-4 font-medium">Termine</th>
              <th className="p-4 font-medium">Shënime</th>
              <th className="p-4 font-medium">Regjistruar</th>
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
                      title={eshteAktiv(profile.id) ? "Aktiv tani" : "Jo aktiv"}
                    />
                    <span className="text-slate-900">{profile.email ?? "—"}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      ROLE_CLASSES[profile.role] ?? ROLE_CLASSES.user
                    }`}
                  >
                    {roleLabel(profile.role)}
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
                  {formatDate(profile.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Rolet ndryshohen vetëm nga paneli i Supabase-it (Table Editor →{" "}
        <code className="rounded bg-slate-100 px-1">profiles</code>), që askush
        të mos e bëjë dot veten admin nga aplikacioni. Vlerat:{" "}
        <code className="rounded bg-slate-100 px-1">user</code>,{" "}
        <code className="rounded bg-slate-100 px-1">manager</code>,{" "}
        <code className="rounded bg-slate-100 px-1">admin</code>.
      </p>
    </main>
  );
}
