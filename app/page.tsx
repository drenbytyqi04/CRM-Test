import Link from "next/link";
import AppointmentForm from "./terminet/appointment-form";
import SetupNotice from "./setup-notice";
import StatusFilter from "./status-filter";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  APPOINTMENT_COLUMNS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_CLASSES,
  appointmentPath,
  appointmentStatusLabel,
  defaultAppointmentSlot,
  formatDuration,
  formatBeograd,
  todayInBeograd,
  type Appointment,
} from "@/lib/types";

// I thotë Next.js-it ta ndërtojë faqen sa herë hapet, që lista të jetë e freskët.
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps<"/">) {
  if (!hasSupabaseConfig()) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900">
          Terminet
        </h1>
        <SetupNotice />
      </main>
    );
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { status, view } = await searchParams;
  const filtri = typeof status === "string" ? status : "";
  // Terminet e regjistruara i sheh çdo i kyçur. Menaxheri mund t'i ngushtojë
  // te "Të mijat".
  const showAll = view !== "mine";
  const sot = todayInBeograd();

  // Radha: i fundit i regjistruar rri lart. Kështu termini që sapo u shtua
  // gjendet menjëherë, pa varur nga data për të cilën është caktuar.
  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_COLUMNS)
    .order("created_at", { ascending: false });

  if (!showAll) query = query.eq("user_id", user.id);
  if (APPOINTMENT_STATUSES.some((s) => s.value === filtri)) {
    query = query.eq("status", filtri);
  }

  const terminetResult = await query.returns<Appointment[]>();
  const terminet = terminetResult.data ?? [];

  const [notesResult, agjentetResult, aktivitetiIm] = await Promise.all([
    terminet.length > 0
      ? supabase
          .from("notes")
          .select("appointment_id")
          .in(
            "appointment_id",
            terminet.map((t) => t.id)
          )
          .returns<{ appointment_id: string }[]>()
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("profiles")
      .select("id, email")
      .returns<{ id: string; email: string | null }[]>(),
    // Koha ime e sotme — çdo përdorues e sheh numrin e vet.
    supabase
      .from("activity_days")
      .select("active_seconds")
      .eq("user_id", user.id)
      .eq("day", sot)
      .maybeSingle<{ active_seconds: number }>(),
  ]);

  const noteCounts = new Map<string, number>();
  for (const n of notesResult.data ?? []) {
    noteCounts.set(n.appointment_id, (noteCounts.get(n.appointment_id) ?? 0) + 1);
  }
  const agjentet = new Map(
    (agjentetResult.data ?? []).map((p) => [p.id, p.email ?? "—"])
  );

  const kontrata = terminet.reduce((s, t) => s + t.contracts_closed, 0);
  const uMbajten = terminet.filter((t) => t.status === "held").length;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Terminet
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {terminet.length} termine · {uMbajten} të mbajtura · {kontrata}{" "}
            kontrata
          </p>
        </div>

        {/* Emaili, roli dhe "Dil" rrinë te menyja anash. */}
        <span
          className="shrink-0 text-sm text-slate-500"
          title="Koha e kaluar sot brenda CRM-së"
        >
          Aktiv sot: {formatDuration(aktivitetiIm.data?.active_seconds ?? 0)}
        </span>
      </header>

      {user.isManager && (
        <>
          <nav className="mb-4 flex gap-2 text-sm">
            <Link
              href={filtri ? `/?status=${filtri}` : "/"}
              className={`rounded-lg px-3 py-1.5 transition ${
                showAll
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-white"
              }`}
            >
              Të gjitha
            </Link>
            <Link
              href={`/?view=mine${filtri ? `&status=${filtri}` : ""}`}
              className={`rounded-lg px-3 py-1.5 transition ${
                showAll
                  ? "border border-slate-300 text-slate-600 hover:bg-white"
                  : "bg-slate-900 text-white"
              }`}
            >
              Të mijat
            </Link>
          </nav>

          <details className="mb-6 rounded-xl border border-slate-200 bg-white">
            <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-700 select-none">
              Cakto termin të ri
            </summary>
            <div className="border-t border-slate-200 p-5">
              <AppointmentForm scheduledDefault={defaultAppointmentSlot()} />
            </div>
          </details>
        </>
      )}

      <div className="mb-4">
        <StatusFilter vlera={filtri} vetemTeMijat={!showAll} />
      </div>

      {terminetResult.error && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Nuk u lexuan dot terminet: {terminetResult.error.message}
        </p>
      )}

      {terminet.length === 0 && !terminetResult.error ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Nuk ka termine këtu.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="p-3 pl-4 font-medium whitespace-nowrap">Nr</th>
                <th className="p-3 font-medium">Emri</th>
                <th className="p-3 font-medium whitespace-nowrap">Data e terminit</th>
                <th className="hidden p-3 font-medium lg:table-cell">Sigurimi</th>
                <th className="hidden p-3 text-right font-medium sm:table-cell">Pers.</th>
                <th className="hidden p-3 text-right font-medium sm:table-cell">Kontr.</th>
                <th className="hidden p-3 text-right font-medium md:table-cell">Shën.</th>
                <th className="p-3 pr-4 font-medium whitespace-nowrap">Statusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terminet.map((t) => (
                <tr key={t.id} className="transition hover:bg-slate-50">
                  <td className="p-3 pl-4 whitespace-nowrap text-slate-400 tabular-nums">
                    {t.nr != null ? `#${t.nr}` : "—"}
                  </td>
                  <td className="p-3">
                    {/* Lidhja rri te emri: një rresht i tërë i klikueshëm
                        nuk lejohet brenda një tabele pa e prishur kuptimin. */}
                    <Link
                      href={appointmentPath(t, user.role)}
                      className="font-medium text-slate-900 underline-offset-2 hover:underline"
                    >
                      {t.name}
                    </Link>
                    {t.user_id !== user.id && (
                      <span className="block truncate text-xs text-slate-400">
                        {agjentet.get(t.user_id) ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap text-slate-600">
                    {formatBeograd(t.scheduled_at)}
                  </td>
                  <td className="hidden p-3 text-slate-600 lg:table-cell">
                    {t.current_insurance || "—"}
                  </td>
                  <td className="hidden p-3 text-right text-slate-600 tabular-nums sm:table-cell">
                    {t.persons_count}
                  </td>
                  <td className="hidden p-3 text-right tabular-nums sm:table-cell">
                    <span
                      className={
                        t.contracts_closed > 0
                          ? "font-medium text-slate-900"
                          : "text-slate-300"
                      }
                    >
                      {t.contracts_closed}
                    </span>
                  </td>
                  <td className="hidden p-3 text-right text-slate-400 tabular-nums md:table-cell">
                    {noteCounts.get(t.id) ?? 0}
                  </td>
                  <td className="p-3 pr-4 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        APPOINTMENT_STATUS_CLASSES[t.status] ??
                        APPOINTMENT_STATUS_CLASSES.cancelled
                      }`}
                    >
                      {appointmentStatusLabel(t.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
