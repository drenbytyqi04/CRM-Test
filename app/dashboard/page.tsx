import Link from "next/link";
import { BarRow, Card, DayBars, StatTile } from "@/app/stats";
import MonthFilter from "./month-filter";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_CATEGORIES,
  categoryStyle,
  appointmentPath,
  beogradDay,
  beogradMonth,
  currentMonth,
  eshteMuaj,
  formatBeograd,
  formatDayShort,
  formatMonth,
  muajtEFundit,
  todayInBeograd,
  type Appointment,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/** Sa muaj prapa mund të shohësh. */
const MUAJ = 24;

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { t, lang, locale } = await getI18n();
  const user = await requireUser();
  const supabase = await createClient();

  const { muaji: muajiParam, view } = await searchParams;
  const muajt = muajtEFundit(MUAJ);
  // Muaji vjen nga adresa dhe mund të jetë çfarëdo. Nëse s'është muaj i
  // vlefshëm, kthehemi te ai i tanishmi në vend që të nxjerrim faqe bosh.
  const muaji =
    typeof muajiParam === "string" && eshteMuaj(muajiParam)
      ? muajiParam
      : currentMonth();
  const sot = todayInBeograd();

  /**
   * Kush sheh çfarë.
   *
   * Admini i sheh të gjitha; mund t'i ngushtojë te të vetat me çelësin.
   * Menaxheri dhe useri shohin vetëm terminet që kanë caktuar vetë.
   *
   * Eksperti është rasti i veçantë: te terminet e tij `user_id` është ai që
   * i caktoi, jo ai vetë. Po ta filtronim sipas `user_id`, do të dilte bosh.
   * Për të, kufirin e ka vënë tashmë baza — sheh vetëm ato që i janë dhënë —
   * prandaj këtu nuk shtohet asgjë.
   */
  const vetemTeMijat = user.isAdmin ? view === "mine" : !user.isExpert;

  /**
   * Kufijtë e muajit, si çaste botërore.
   *
   * Merret një ditë më shumë nga të dyja anët, dhe ndarja e saktë bëhet më
   * poshtë me `beogradMonth`. Ndryshe do të duhej llogaritur me dorë sa është
   * dallimi i Beogradit nga ora botërore atë ditë — dhe ai ndryshon me orën
   * e verës. Kështu përgjigjen e jep kalendari, jo ne.
   */
  const [vitiM, muajiM] = muaji.split("-").map(Number);
  const ngaISO = new Date(Date.UTC(vitiM, muajiM - 1, 1, -36)).toISOString();
  const deriISO = new Date(Date.UTC(vitiM, muajiM, 1, 36)).toISOString();

  let kerkesa = supabase
    .from("appointments")
    .select("*")
    .gte("scheduled_at", ngaISO)
    .lt("scheduled_at", deriISO)
    .order("scheduled_at", { ascending: true });
  if (vetemTeMijat) kerkesa = kerkesa.eq("user_id", user.id);

  const [terminetResult, notesResult, profilesResult] = await Promise.all([
    kerkesa.returns<Appointment[]>(),
    supabase.from("notes").select("id, user_id").returns<
      { id: string; user_id: string }[]
    >(),
    supabase
      .from("profiles")
      .select("id, email")
      .returns<{ id: string; email: string | null }[]>(),
  ]);

  // Ndarja e saktë e muajit bëhet këtu, me orën e Beogradit.
  const terminet = (terminetResult.data ?? []).filter(
    (a) => beogradMonth(a.scheduled_at) === muaji
  );
  const notes = notesResult.data ?? [];
  const emailet = new Map(
    (profilesResult.data ?? []).map((p) => [p.id, p.email ?? "—"])
  );

  // ---------- Numrat kryesorë ----------
  const persona = terminet.reduce((s, t) => s + t.persons_count, 0);
  const kontrata = terminet.reduce((s, t) => s + t.contracts_closed, 0);
  // Të suksesshme: u mbajtën DHE dhanë kontratë. Kategoria e mban vetë atë
  // kusht, prandaj mjafton ta numërosh atë.
  const uMbajten = terminet.filter((t) => t.category === "success").length;

  // Sa nga terminet që s'janë më në bisedim përfunduan me sukses. Kjo tregon
  // cilësinë e punës më mirë se numri i thatë i kontratave.
  const teMbyllura = terminet.filter((t) => t.category !== "talking").length;
  const normaMbylljes =
    teMbyllura > 0 ? Math.round((uMbajten / teMbyllura) * 100) : 0;

  const teDeshtuara = terminet.filter((t) => t.category === "failed").length;
  const neBisedim = terminet.filter((t) => t.category === "talking").length;
  const sotTermine = terminet.filter(
    (t) => beogradDay(t.scheduled_at) === sot
  ).length;

  // ---------- Ndarja sipas rezultatit (tri kategoritë) ----------
  // Radha mbetet ajo e kategorive, jo sipas sasisë: tri shtylla që hidhen
  // sa herë ndryshojnë numrat lexohen më keq se tri shtylla që rrinë fiks.
  const sipasStatusit = APPOINTMENT_CATEGORIES.map((c) => ({
    ...c,
    sa: terminet.filter((t) => t.category === c.value).length,
  }));
  const maksStatus = Math.max(1, ...sipasStatusit.map((s) => s.sa));

  // ---------- Arsyet, brenda kategorive ----------
  const sipasArsyes = APPOINTMENT_STATUSES.map((s) => ({
    ...s,
    sa: terminet.filter((t) => t.status === s.value).length,
  }))
    .filter((s) => s.sa > 0)
    .sort((a, b) => b.sa - a.sa);
  const maksArsye = Math.max(1, ...sipasArsyes.map((s) => s.sa));

  // ---------- Ditët e muajit ----------
  // Grafiku tregon ditët e vetë muajit të zgjedhur, jo 14 ditët e fundit:
  // ndryshe do të kishte dy periudha të ndryshme në të njëjtën faqe.
  const ditetEMuajit = Array.from(
    { length: new Date(Date.UTC(vitiM, muajiM, 0)).getUTCDate() },
    (_, i) => `${muaji}-${String(i + 1).padStart(2, "0")}`
  );
  const perDite = ditetEMuajit.map((dita) => ({
    dita,
    etiketa: formatDayShort(dita),
    vlera: terminet.filter((a) => beogradDay(a.scheduled_at) === dita).length,
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
          {t.dashTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {user.isExpert
            ? t.dashScopeAssigned
            : vetemTeMijat
              ? t.dashScopeMine
              : t.dashScopeAll}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <MonthFilter
            vlera={muaji}
            muajt={muajt.map((m) => ({
              vlera: m,
              etiketa: formatMonth(m, locale),
            }))}
            vetemTeMijat={vetemTeMijat}
            lang={lang}
          />

          {/* Vetëm admini i sheh të gjitha, prandaj vetëm ai ka ç'të
              ngushtojë. Për të tjerët kufiri s'është zgjedhje. */}
          {user.isAdmin && (
            <nav className="flex gap-2 text-sm">
              <Link
                href={`/dashboard?muaji=${muaji}`}
                className={`rounded-lg px-3 py-1.5 transition ${
                  vetemTeMijat
                    ? "border border-slate-300 text-slate-600 hover:bg-white"
                    : "bg-slate-900 text-white"
                }`}
              >
                {t.dashAll}
              </Link>
              <Link
                href={`/dashboard?muaji=${muaji}&view=mine`}
                className={`rounded-lg px-3 py-1.5 transition ${
                  vetemTeMijat
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 text-slate-600 hover:bg-white"
                }`}
              >
                {t.dashMine}
              </Link>
            </nav>
          )}
        </div>
      </header>

      {terminetResult.error && (
        <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {t.listLoadError}: {terminetResult.error.message}
        </p>
      )}

      {/* ---------- Numrat e mëdhenj ---------- */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          etiketa={t.dashTotal}
          vlera={terminet.length}
          nen={t.dashPersons(persona)}
        />
        <StatTile
          etiketa={t.dashHeld}
          vlera={uMbajten}
          nen={
            terminet.length > 0
              ? t.dashOfAll(Math.round((uMbajten / terminet.length) * 100))
              : t.noValue
          }
        />
        <StatTile
          etiketa={t.dashContracts}
          vlera={kontrata}
          nen={t.dashCloseRate(normaMbylljes)}
        />
        <StatTile
          etiketa={t.catFailed}
          vlera={teDeshtuara}
          nen={sotTermine > 0 ? t.dashTodayN(sotTermine) : t.dashTalkingN(neBisedim)}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* ---------- Statuset ---------- */}
        <Card
          titull={t.dashByStatus}
          nen={t.dashByStatusHint}
        >
          {sipasStatusit.length === 0 ? (
            <p className="text-sm text-slate-500">{t.dashNoAppointments}</p>
          ) : (
            <div>
              {sipasStatusit.map((s) => (
                <BarRow
                  key={s.value}
                  etiketa={t[s.key]}
                  vlera={s.sa}
                  maks={maksStatus}
                  perqindje={Math.round((s.sa / terminet.length) * 100)}
                  shenja={
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        categoryStyle(s.value).shirit
                      }`}
                    />
                  }
                />
              ))}
            </div>
          )}
        </Card>

        {/* ---------- Arsyet, brenda kategorive ---------- */}
        <Card titull={t.dashByReason} nen={t.dashByReasonHint}>
          {sipasArsyes.length === 0 ? (
            <p className="text-sm text-slate-500">{t.dashNoAppointments}</p>
          ) : (
            <div>
              {sipasArsyes.map((s) => (
                <BarRow
                  key={s.value}
                  etiketa={t[s.key]}
                  vlera={s.sa}
                  maks={maksArsye}
                  perqindje={Math.round((s.sa / terminet.length) * 100)}
                  shenja={
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        categoryStyle(s.category).shirit
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
          titull={t.dashByDay}
          nen={t.dashByDayHint(formatMonth(muaji, locale))}
        >
          <DayBars dite={perDite} />
        </Card>
      </div>

      {/* ---------- Terminet e radhës ---------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card titull={t.dashInMonth} nen={t.dashInMonthHint}>
          {terminet.length === 0 ? (
            <p className="text-sm text-slate-500">{t.dashNoneInMonth}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {terminet
                .slice(0, 5)
                .map((termini) => (
                  <li key={termini.id}>
                    <Link
                      href={appointmentPath(termini, user.role)}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-slate-900">
                          {termini.nr != null && (
                            <span className="mr-1.5 text-slate-400">
                              #{termini.nr}
                            </span>
                          )}
                          {termini.name}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {formatBeograd(termini.scheduled_at, locale)}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {termini.persons_count} {t.dashPersShort}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        {/* ---------- Agjentët: vetëm admini, dhe vetëm kur sheh të
             gjitha. Te «Të mijat» do të ishte një rresht i vetëm. ---------- */}
        {user.isAdmin && !vetemTeMijat ? (
          <Card
            titull={t.dashByAgent}
            nen={t.dashByAgentHint}
          >
            {agjentet.length === 0 ? (
              <p className="text-sm text-slate-500">{t.dashNoAppointments}</p>
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
                  {t.dashContractsLine}:{" "}
                  {agjentet
                    .map((a) => `${a.email.split("@")[0]} ${a.kontrata}`)
                    .join(" · ")}
                </p>
              </div>
            )}
          </Card>
        ) : (
          <Card titull={t.dashNotes} nen={t.dashNotesHint}>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {notes.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {t.dashNotesMine(notes.filter((n) => n.user_id === user.id).length)}
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
