import Link from "next/link";
import { BarRow, Card, DayBars, StatTile } from "@/app/stats";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_CLASSES,
  appointmentPath,
  beogradDay,
  ditetEFundit,
  formatBeograd,
  formatDayShort,
  todayInBeograd,
  type Appointment,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/** Sa ditë prapa shfaqet grafiku ditor. */
const DITE = 14;

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const dite = ditetEFundit(DITE);
  const sot = todayInBeograd();

  const [terminetResult, notesResult, profilesResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Appointment[]>(),
    supabase.from("notes").select("id, user_id").returns<
      { id: string; user_id: string }[]
    >(),
    supabase
      .from("profiles")
      .select("id, email")
      .returns<{ id: string; email: string | null }[]>(),
  ]);

  const terminet = terminetResult.data ?? [];
  const notes = notesResult.data ?? [];
  const emailet = new Map(
    (profilesResult.data ?? []).map((p) => [p.id, p.email ?? "—"])
  );

  // ---------- Numrat kryesorë ----------
  const persona = terminet.reduce((s, t) => s + t.persons_count, 0);
  const kontrata = terminet.reduce((s, t) => s + t.contracts_closed, 0);
  const uMbajten = terminet.filter((t) => t.status === "held").length;

  // Sa nga terminet e mbajtura dhanë të paktën një kontratë. Kjo tregon
  // cilësinë e punës më mirë se numri i thatë i kontratave.
  const meKontrate = terminet.filter((t) => t.contracts_closed > 0).length;
  const normaMbylljes =
    uMbajten > 0 ? Math.round((meKontrate / uMbajten) * 100) : 0;

  const tani = new Date().toISOString();
  const teArdhshme = terminet.filter(
    (t) => t.scheduled_at > tani && t.status === "open"
  );
  const sotTermine = terminet.filter(
    (t) => beogradDay(t.scheduled_at) === sot
  ).length;

  // ---------- Ndarja sipas statusit ----------
  const sipasStatusit = APPOINTMENT_STATUSES.map((s) => ({
    ...s,
    sa: terminet.filter((t) => t.status === s.value).length,
  }))
    .filter((s) => s.sa > 0)
    .sort((a, b) => b.sa - a.sa);
  const maksStatus = Math.max(1, ...sipasStatusit.map((s) => s.sa));

  // ---------- Të regjistruar ditë pas dite ----------
  const perDite = dite.map((dita) => ({
    dita,
    etiketa: formatDayShort(dita),
    vlera: terminet.filter((t) => beogradDay(t.created_at) === dita).length,
  }));

  // ---------- Kush sa ka caktuar (vetëm për adminin) ----------
  const perAgjent = new Map<string, { termine: number; kontrata: number }>();
  for (const t of terminet) {
    const rreshti = perAgjent.get(t.user_id) ?? { termine: 0, kontrata: 0 };
    rreshti.termine += 1;
    rreshti.kontrata += t.contracts_closed;
    perAgjent.set(t.user_id, rreshti);
  }
  const agjentet = [...perAgjent.entries()]
    .map(([id, v]) => ({ id, email: emailet.get(id) ?? "—", ...v }))
    .sort((a, b) => b.termine - a.termine);
  const maksAgjent = Math.max(1, ...agjentet.map((a) => a.termine));

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pamja e përgjithshme e termineve. Numrat llogariten sa herë hapet
          faqja.
        </p>
      </header>

      {terminetResult.error && (
        <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Nuk u lexuan dot terminet: {terminetResult.error.message}
        </p>
      )}

      {/* ---------- Numrat e mëdhenj ---------- */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          etiketa="Termine gjithsej"
          vlera={terminet.length}
          nen={`${persona} persona`}
        />
        <StatTile
          etiketa="U mbajtën"
          vlera={uMbajten}
          nen={
            terminet.length > 0
              ? `${Math.round((uMbajten / terminet.length) * 100)}% e të gjithave`
              : "—"
          }
        />
        <StatTile
          etiketa="Kontrata të mbyllura"
          vlera={kontrata}
          nen={`${normaMbylljes}% e termineve të mbajtura dhanë kontratë`}
        />
        <StatTile
          etiketa="Të ardhshme"
          vlera={teArdhshme.length}
          nen={sotTermine > 0 ? `${sotTermine} sot` : "asnjë sot"}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* ---------- Statuset ---------- */}
        <Card
          titull="Sipas statusit"
          nen="Çdo termin ka vetëm një status njëherësh."
        >
          {sipasStatusit.length === 0 ? (
            <p className="text-sm text-slate-500">Ende s&apos;ka termine.</p>
          ) : (
            <div>
              {sipasStatusit.map((s) => (
                <BarRow
                  key={s.value}
                  etiketa={s.label}
                  vlera={s.sa}
                  maks={maksStatus}
                  perqindje={Math.round((s.sa / terminet.length) * 100)}
                  shenja={
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ${
                        APPOINTMENT_STATUS_CLASSES[s.value] ??
                        APPOINTMENT_STATUS_CLASSES.cancelled
                      }`}
                    />
                  }
                />
              ))}
            </div>
          )}
        </Card>

        {/* ---------- Ditët e fundit ---------- */}
        <Card
          titull="Të regjistruar sipas ditës"
          nen={`${DITE} ditët e fundit, sipas orës së Beogradit.`}
        >
          <DayBars dite={perDite} />
        </Card>
      </div>

      {/* ---------- Terminet e radhës ---------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card titull="Terminet e radhës" nen="Pesë të parët që vijnë.">
          {teArdhshme.length === 0 ? (
            <p className="text-sm text-slate-500">
              Asnjë termin i hapur në të ardhmen.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {[...teArdhshme]
                .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
                .slice(0, 5)
                .map((t) => (
                  <li key={t.id}>
                    <Link
                      href={appointmentPath(t, user.role)}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-slate-900">
                          {t.nr != null && (
                            <span className="mr-1.5 text-slate-400">
                              #{t.nr}
                            </span>
                          )}
                          {t.name}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {formatBeograd(t.scheduled_at)}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {t.persons_count} pers.
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        {/* ---------- Agjentët: vetëm admini ---------- */}
        {user.isAdmin ? (
          <Card
            titull="Sipas agjentit"
            nen="Kush i ka caktuar terminet dhe sa kontrata dolën."
          >
            {agjentet.length === 0 ? (
              <p className="text-sm text-slate-500">Ende s&apos;ka termine.</p>
            ) : (
              <div>
                {agjentet.map((a) => (
                  <BarRow
                    key={a.id}
                    etiketa={a.email}
                    vlera={a.termine}
                    maks={maksAgjent}
                  />
                ))}
                <p className="mt-3 text-xs text-slate-500">
                  Kontrata:{" "}
                  {agjentet
                    .map((a) => `${a.email.split("@")[0]} ${a.kontrata}`)
                    .join(" · ")}
                </p>
              </div>
            )}
          </Card>
        ) : (
          <Card titull="Shënimet" nen="Feedback-u i shkruar te terminet.">
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {notes.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {notes.filter((n) => n.user_id === user.id).length} të shkruara
              nga ti.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
