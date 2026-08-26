import Link from "next/link";
import SignOutButton from "@/app/sign-out-button";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  APPOINTMENT_COLUMNS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_CLASSES,
  appointmentStatusLabel,
  formatTirane,
  type Appointment,
} from "@/lib/types";
import SetupNotice from "@/app/setup-notice";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: PageProps<"/takimet">) {
  if (!hasSupabaseConfig()) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <SetupNotice />
      </main>
    );
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { status, view } = await searchParams;
  const filtri = typeof status === "string" ? status : "";
  // Takimet e regjistruara i sheh çdo i kyçur. Menaxheri mund t'i ngushtojë
  // te "Të mijat".
  const showAll = view !== "mine";

  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_COLUMNS)
    .order("scheduled_at", { ascending: false });

  if (!showAll) query = query.eq("user_id", user.id);
  if (APPOINTMENT_STATUSES.some((s) => s.value === filtri)) {
    query = query.eq("status", filtri);
  }

  const takimetResult = await query.returns<Appointment[]>();
  const takimet = takimetResult.data ?? [];

  // Emrat e klientëve dhe emailet e agjentëve, në një kërkesë secili.
  const clientIds = [...new Set(takimet.map((t) => t.client_id))];
  const [clientsResult, ownersResult] = await Promise.all([
    clientIds.length > 0
      ? supabase
          .from("clients")
          .select("id, name")
          .in("id", clientIds)
          .returns<{ id: string; name: string }[]>()
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("profiles")
      .select("id, email")
      .returns<{ id: string; email: string | null }[]>(),
  ]);

  const emrat = new Map((clientsResult.data ?? []).map((c) => [c.id, c.name]));
  const agjentet = new Map(
    (ownersResult.data ?? []).map((p) => [p.id, p.email ?? "—"])
  );

  const kontrata = takimet.reduce((s, t) => s + t.contracts_closed, 0);
  const uMbajten = takimet.filter((t) => t.status === "held").length;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-sm text-slate-500 transition hover:text-slate-900"
          >
            ← Klientët
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Takimet
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {takimet.length} takime · {uMbajten} të mbajtura · {kontrata}{" "}
            kontrata
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      {user.isManager && (
        <nav className="mb-4 flex gap-2 text-sm">
          <Link
            href={`/takimet?view=all${filtri ? `&status=${filtri}` : ""}`}
            className={`rounded-lg px-3 py-1.5 transition ${
              showAll
                ? "bg-slate-900 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-white"
            }`}
          >
            Të gjitha
          </Link>
          <Link
            href={`/takimet?view=mine${filtri ? `&status=${filtri}` : ""}`}
            className={`rounded-lg px-3 py-1.5 transition ${
              showAll
                ? "border border-slate-300 text-slate-600 hover:bg-white"
                : "bg-slate-900 text-white"
            }`}
          >
            Të mijat
          </Link>
        </nav>
      )}

      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link
          href={`/takimet${showAll && user.isManager ? "?view=all" : ""}`}
          className={`rounded-lg px-3 py-1.5 transition ${
            filtri === ""
              ? "bg-slate-200 text-slate-900"
              : "border border-slate-300 text-slate-600 hover:bg-white"
          }`}
        >
          Të gjitha statuset
        </Link>
        {APPOINTMENT_STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/takimet?status=${s.value}${
              showAll && user.isManager ? "&view=all" : ""
            }`}
            className={`rounded-lg px-3 py-1.5 transition ${
              filtri === s.value
                ? "bg-slate-200 text-slate-900"
                : "border border-slate-300 text-slate-600 hover:bg-white"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {takimetResult.error && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Nuk u lexuan dot takimet: {takimetResult.error.message}
        </p>
      )}

      {takimet.length === 0 && !takimetResult.error ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Nuk ka takime këtu.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {takimet.map((t) => (
            <li key={t.id}>
              <Link
                href={`/takimet/${t.id}`}
                className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {emrat.get(t.client_id) ?? "Klient i panjohur"}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {formatTirane(t.scheduled_at)}
                    {t.current_insurance ? ` · ${t.current_insurance}` : ""}
                    {` · ${t.persons_count} persona`}
                  </p>
                  {t.user_id !== user.id && (
                    <p className="mt-1 truncate text-xs text-slate-400">
                      Caktuar nga: {agjentet.get(t.user_id) ?? "—"}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {t.contracts_closed > 0 && (
                    <span className="text-xs text-slate-500">
                      {t.contracts_closed} kontrata
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      APPOINTMENT_STATUS_CLASSES[t.status] ??
                      APPOINTMENT_STATUS_CLASSES.cancelled
                    }`}
                  >
                    {appointmentStatusLabel(t.status)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
