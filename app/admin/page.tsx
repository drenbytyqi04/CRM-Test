import Link from "next/link";
import SignOutButton from "@/app/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatDate, type Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Faqja e administratorit: të gjithë përdoruesit dhe sa të dhëna ka secili. */
export default async function AdminPage() {
  // Kush s'është admin, dërgohet te faqja kryesore.
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [profilesResult, clientsResult, notesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: true })
      .returns<Profile[]>(),
    supabase.from("clients").select("user_id").returns<{ user_id: string }[]>(),
    supabase.from("notes").select("user_id").returns<{ user_id: string }[]>(),
  ]);

  const profiles = profilesResult.data ?? [];

  const countBy = (rows: { user_id: string }[] | null) => {
    const map = new Map<string, number>();
    for (const row of rows ?? []) {
      map.set(row.user_id, (map.get(row.user_id) ?? 0) + 1);
    }
    return map;
  };

  const clientCounts = countBy(clientsResult.data);
  const noteCounts = countBy(notesResult.data);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-sm text-slate-500 transition hover:text-slate-900"
          >
            ← Klientët
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Përdoruesit
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Të gjitha llogaritë e regjistruara në sistem.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {admin.email}
          </span>
          <SignOutButton />
        </div>
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
              <th className="p-4 font-medium">Klientë</th>
              <th className="p-4 font-medium">Shënime</th>
              <th className="p-4 font-medium">Regjistruar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="p-4 text-slate-900">{profile.email ?? "—"}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      profile.role === "admin"
                        ? "bg-slate-900 text-white ring-slate-900"
                        : "bg-slate-100 text-slate-600 ring-slate-200"
                    }`}
                  >
                    {profile.role === "admin" ? "Admin" : "Përdorues"}
                  </span>
                </td>
                <td className="p-4 text-slate-600">
                  {clientCounts.get(profile.id) ?? 0}
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
        të mos e bëjë dot veten admin nga aplikacioni.
      </p>
    </main>
  );
}
