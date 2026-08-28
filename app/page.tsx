import Link from "next/link";
import AppointmentForm from "./terminet/appointment-form";
import SetupNotice from "./setup-notice";
import StatusFilter from "./status-filter";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
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
  const { t, lang, locale } = await getI18n();

  if (!hasSupabaseConfig()) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900">
          {t.listTitle}
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
            {t.listTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.listSummary(terminet.length, uMbajten, kontrata)}
          </p>
        </div>

        {/* Emaili, roli dhe "Dil" rrinë te menyja anash. */}
        <span
          className="shrink-0 text-sm text-slate-500"
          title={t.activeTodayTitle}
        >
          {t.activeToday}: {formatDuration(aktivitetiIm.data?.active_seconds ?? 0)}
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
              {t.listAll}
            </Link>
            <Link
              href={`/?view=mine${filtri ? `&status=${filtri}` : ""}`}
              className={`rounded-lg px-3 py-1.5 transition ${
                showAll
                  ? "border border-slate-300 text-slate-600 hover:bg-white"
                  : "bg-slate-900 text-white"
              }`}
            >
              {t.listMine}
            </Link>
          </nav>

          <details className="mb-6 rounded-xl border border-slate-200 bg-white">
            <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-700 select-none">
              {t.listNewAppointment}
            </summary>
            <div className="border-t border-slate-200 p-5">
              <AppointmentForm
                scheduledDefault={defaultAppointmentSlot()}
                lang={lang}
              />
            </div>
          </details>
        </>
      )}

      <div className="mb-4">
        <StatusFilter vlera={filtri} vetemTeMijat={!showAll} lang={lang} />
      </div>

      {terminetResult.error && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {t.listLoadError}: {terminetResult.error.message}
        </p>
      )}

      {terminet.length === 0 && !terminetResult.error ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          {t.listEmpty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="p-3 pl-4 font-medium whitespace-nowrap">{t.colNr}</th>
                <th className="p-3 font-medium">{t.colName}</th>
                <th className="p-3 font-medium whitespace-nowrap">{t.colDate}</th>
                <th className="hidden p-3 font-medium lg:table-cell">{t.colInsurance}</th>
                <th className="hidden p-3 text-right font-medium sm:table-cell">{t.colPersons}</th>
                <th className="hidden p-3 text-right font-medium sm:table-cell">{t.colContracts}</th>
                <th className="hidden p-3 text-right font-medium md:table-cell">{t.colNotes}</th>
                <th className="p-3 pr-4 font-medium whitespace-nowrap">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terminet.map((termini) => (
                <tr key={termini.id} className="transition hover:bg-slate-50">
                  <td className="p-3 pl-4 whitespace-nowrap text-slate-400 tabular-nums">
                    {termini.nr != null ? `#${termini.nr}` : "—"}
                  </td>
                  <td className="p-3">
                    {/* Lidhja rri te emri: një rresht i tërë i klikueshëm
                        nuk lejohet brenda një tabele pa e prishur kuptimin. */}
                    <Link
                      href={appointmentPath(termini, user.role)}
                      className="font-medium text-slate-900 underline-offset-2 hover:underline"
                    >
                      {termini.name}
                    </Link>
                    {termini.user_id !== user.id && (
                      <span className="block truncate text-xs text-slate-400">
                        {agjentet.get(termini.user_id) ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap text-slate-600">
                    {formatBeograd(termini.scheduled_at, locale)}
                  </td>
                  <td className="hidden p-3 text-slate-600 lg:table-cell">
                    {termini.current_insurance || "—"}
                  </td>
                  <td className="hidden p-3 text-right text-slate-600 tabular-nums sm:table-cell">
                    {termini.persons_count}
                  </td>
                  <td className="hidden p-3 text-right tabular-nums sm:table-cell">
                    <span
                      className={
                        termini.contracts_closed > 0
                          ? "font-medium text-slate-900"
                          : "text-slate-300"
                      }
                    >
                      {termini.contracts_closed}
                    </span>
                  </td>
                  <td className="hidden p-3 text-right text-slate-400 tabular-nums md:table-cell">
                    {noteCounts.get(termini.id) ?? 0}
                  </td>
                  <td className="p-3 pr-4 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        APPOINTMENT_STATUS_CLASSES[termini.status] ??
                        APPOINTMENT_STATUS_CLASSES.cancelled
                      }`}
                    >
                      {appointmentStatusLabel(termini.status, t)}
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
