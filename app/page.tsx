import Link from "next/link";
import AppointmentForm from "./terminet/appointment-form";
import SetupNotice from "./setup-notice";
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

  /** Ndërton adresën e filtrit, duke ruajtur pamjen "Të mijat". */
  const filterHref = (value: string) => {
    const params = [
      value ? `status=${value}` : "",
      showAll ? "" : "view=mine",
    ].filter(Boolean);
    return params.length > 0 ? `/?${params.join("&")}` : "/";
  };

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

      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link
          href={filterHref("")}
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
            href={filterHref(s.value)}
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
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {terminet.map((t) => (
            <li key={t.id}>
              <Link
                href={appointmentPath(t, user.role)}
                className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {t.nr != null && (
                      <span className="mr-2 font-normal text-slate-400">
                        #{t.nr}
                      </span>
                    )}
                    {t.name}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {formatBeograd(t.scheduled_at)}
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
                  <span className="text-xs text-slate-400">
                    {noteCounts.get(t.id) ?? 0} shënime
                  </span>
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
