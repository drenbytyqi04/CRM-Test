import Link from "next/link";
import AppointmentForm from "./terminet/appointment-form";
import SetupNotice from "./setup-notice";
import StatusFilter from "./status-filter";
import Pagination from "./pagination";
import SearchBox from "./search-box";
import BulkAssign from "./bulk-assign";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import {
  APPOINTMENT_COLUMNS,
  APPOINTMENT_CATEGORIES,
  appointmentCategoryLabel,
  appointmentPath,
  categoryStyle,
  defaultAppointmentSlot,
  formatDuration,
  formatBeograd,
  todayInBeograd,
  type Appointment,
} from "@/lib/types";

// I thotë Next.js-it ta ndërtojë faqen sa herë hapet, që lista të jetë e freskët.
export const dynamic = "force-dynamic";

/**
 * Sa termine në një faqe.
 *
 * Më parë lista i merrte të gjitha. Me 2000 termine faqja dilte 1.6 MB dhe
 * 90 000 piksela e gjatë — rreth 100 ekrane scroll. Kolona e shënimeve
 * prishej fare: adresa e kërkesës arrinte 72 KB dhe serveri e kthente me
 * gabimin 431, prandaj çdo rresht tregonte 0 shënime edhe kur kishte.
 *
 * 50 është aq sa mbush një ekran e ca: sheh menjëherë ku je, dhe faqja
 * mbetet nën 100 KB.
 */
const FAQE_MADHESIA = 50;

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

  const { status, view, kerko, faqe } = await searchParams;
  const filtri = typeof status === "string" ? status : "";
  const kerkimi = typeof kerko === "string" ? kerko.trim() : "";
  // Faqja vjen nga adresa dhe mund të jetë çfarëdo: «abc», «-3», «99999».
  // Prandaj kthehet në numër dhe kufizohet më poshtë, pasi dimë sa faqe ka.
  const faqjaEKerkuar = Math.max(1, Number(faqe) || 1);
  // Kush i sheh të gjitha, dhe kush vetëm të vetat.
  //
  // Menaxheri dhe admini i shohin të gjitha, me çelësin «Të mijat» për t'i
  // ngushtuar. Përdoruesi i thjeshtë ka vetëm të vetat, gjithmonë.
  //
  // Eksperti bën përjashtim dhe duhet lënë te «të gjitha»: te terminet e tij
  // `user_id` është ai që ia caktoi, jo vetë ai. Filtri sipas `user_id` do t'i
  // dilte bosh. Për të e bën ndarjen vetë baza (`supabase/eksperti.sql`).
  const showAll = user.isManager ? view !== "mine" : user.isExpert;
  const sot = todayInBeograd();

  // Radha: i fundit i regjistruar rri lart. Kështu termini që sapo u shtua
  // gjendet menjëherë, pa varur nga data për të cilën është caktuar.
  const kategoriaIVlefshme = APPOINTMENT_CATEGORIES.some((c) => c.value === filtri);

  // `count: "exact"` e bën bazën ta numërojë tërë grupin, edhe pse kthen
  // vetëm një faqe. Pa të nuk dihet sa faqe ka — dhe përmbledhja lart do të
  // tregonte 50 në vend të 2000.
  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    // Ndarës i dytë, i detyrueshëm sapo lista u nda në faqe. Dy termine të
    // regjistruar brenda të njëjtit çast kanë të njëjtën `created_at`, dhe
    // atëherë radha mes tyre s'është e përcaktuar: baza mund t'i kthejë
    // ndryshe sa herë. Me faqe kjo do të thoshte se i njëjti termin del në
    // dy faqe, ose nuk del në asnjërën. `nr` është unik, prandaj e mbyll.
    .order("nr", { ascending: false });

  if (!showAll) query = query.eq("user_id", user.id);
  if (kategoriaIVlefshme) query = query.eq("category", filtri);
  if (kerkimi) {
    // Emri kudo brenda tekstit, ose numri i shkurtër i saktë (#1234).
    const siNumer = /^#?\d+$/.test(kerkimi) ? Number(kerkimi.replace("#", "")) : null;
    query = siNumer
      ? query.or(`name.ilike.%${kerkimi}%,nr.eq.${siNumer}`)
      : query.ilike("name", `%${kerkimi}%`);
  }

  // Faqja e parë merret gjithmonë; nëse numri i kërkuar del jashtë, faqja
  // rregullohet pasi dimë sa rreshta ka gjithsej.
  const nga = (faqjaEKerkuar - 1) * FAQE_MADHESIA;
  const terminetResult = await query
    .range(nga, nga + FAQE_MADHESIA - 1)
    .returns<Appointment[]>();

  const terminet = terminetResult.data ?? [];
  const sagjithsej = terminetResult.count ?? terminet.length;
  const faqeGjithsej = Math.max(1, Math.ceil(sagjithsej / FAQE_MADHESIA));
  const faqja = Math.min(faqjaEKerkuar, faqeGjithsej);

  /**
   * Adresa e listës me këto zgjedhje.
   *
   * Çdo lidhje e listës — «Të gjitha», «Të mijat», butonat e faqeve — e
   * ndërton adresën këtu, që asnjëra të mos harrojë ndonjë parametër. Kur
   * ndryshon filtri ose pamja, `faqe` bie qëllimisht: rezultatet janë të
   * tjera, prandaj faqja 7 e mëparshme s'ka kuptim.
   */
  const adresaEListes = (o: {
    view?: "mine" | "all";
    faqe?: number;
  } = {}) => {
    const p = new URLSearchParams();
    // `view` ka kuptim vetëm aty ku ka çelës: te menaxheri dhe admini. Për
    // të tjerët do të ishte një parametër që s'ndryshon asgjë.
    const vetemTeMijat =
      user.isManager && (o.view ? o.view === "mine" : !showAll);
    if (vetemTeMijat) p.set("view", "mine");
    if (filtri) p.set("status", filtri);
    if (kerkimi) p.set("kerko", kerkimi);
    if (o.faqe && o.faqe > 1) p.set("faqe", String(o.faqe));
    const q = p.toString();
    return q ? `/?${q}` : "/";
  };

  const [notesResult, agjentetResult, aktivitetiIm, permbledhja] = await Promise.all([
    // Shënimet vetëm për terminet e KËSAJ faqeje. Me të gjitha id-të, adresa
    // e kërkesës arrinte 72 KB dhe serveri e kthente me 431 — pa gabim të
    // dukshëm, thjesht çdo rresht tregonte 0 shënime.
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
      .select("id, email, role")
      .returns<{ id: string; email: string | null; role: string }[]>(),
    // Koha ime e sotme — çdo përdorues e sheh numrin e vet.
    supabase
      .from("activity_days")
      .select("active_seconds")
      .eq("user_id", user.id)
      .eq("day", sot)
      .maybeSingle<{ active_seconds: number }>(),
    // Numrat e përmbledhjes janë të TËRË grupit, jo të faqes që sheh.
    // Prandaj i llogarit baza (`supabase/faqosja.sql`) dhe kthen tre numra
    // në vend të mijëra rreshtave.
    supabase
      .rpc("appointments_summary", {
        p_user: showAll ? null : user.id,
        p_category: kategoriaIVlefshme ? filtri : null,
        p_search: kerkimi || null,
      })
      .maybeSingle<{ total: number; held: number; contracts: number }>(),
  ]);

  const noteCounts = new Map<string, number>();
  for (const n of notesResult.data ?? []) {
    noteCounts.set(n.appointment_id, (noteCounts.get(n.appointment_id) ?? 0) + 1);
  }
  const agjentet = new Map(
    (agjentetResult.data ?? []).map((p) => [p.id, p.email ?? "—"])
  );

  // Shiriti i zgjedhjes duket vetëm për adminin, dhe vetëm nëse ka të kujt
  // t'ia japë. Kufiri i vërtetë rri te baza; kjo është thjesht pamje.
  const eksperte = user.isAdmin
    ? (agjentetResult.data ?? [])
        .filter((p) => p.role === "expert")
        .map((p) => ({ id: p.id, email: p.email ?? "—" }))
    : [];
  const meZgjedhje = user.isAdmin && eksperte.length > 0;

  // Nëse `supabase/faqosja.sql` s'është ngritur ende, funksioni mungon.
  // Atëherë tregohet vetëm numri i termineve — i saktë gjithsesi, sepse vjen
  // nga `count`. Më mirë një numër më pak se tre numra të gabuar.
  const numrat = permbledhja.data;
  const uMbajten = numrat?.held ?? null;
  const kontrata = numrat?.contracts ?? null;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {t.listTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {uMbajten != null && kontrata != null
              ? t.listSummary(sagjithsej, uMbajten, kontrata)
              : t.listSummaryShort(sagjithsej)}
            {faqeGjithsej > 1 && (
              <span className="text-slate-400">
                {" · "}
                {t.pageOf(faqja, faqeGjithsej)}
              </span>
            )}
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
          <nav className="mb-4 flex gap-2 text-sm">
            <Link
              href={adresaEListes({ view: "all" })}
              className={`rounded-lg px-3 py-1.5 transition ${
                showAll
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-white"
              }`}
            >
              {t.listAll}
            </Link>
            <Link
              href={adresaEListes({ view: "mine" })}
              className={`rounded-lg px-3 py-1.5 transition ${
                showAll
                  ? "border border-slate-300 text-slate-600 hover:bg-white"
                  : "bg-slate-900 text-white"
              }`}
            >
              {t.listMine}
            </Link>
          </nav>
      )}

      {/* Termin të ri cakton kushdo veç ekspertit. Përdoruesi i thjeshtë e
          sheh pastaj vetëm atë që caktoi vetë. */}
      {user.canCreate && (
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
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <StatusFilter
          vlera={filtri}
          vetemTeMijat={user.isManager && !showAll}
          kerkimi={kerkimi}
          lang={lang}
        />
        <SearchBox
          vlera={kerkimi}
          status={filtri}
          vetemTeMijat={user.isManager && !showAll}
          t={t}
        />
      </div>

      {terminetResult.error && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {t.listLoadError}: {terminetResult.error.message}
        </p>
      )}

      {terminet.length === 0 && !terminetResult.error ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          {kerkimi
            ? t.searchNoResult(kerkimi)
            : user.isExpert
              ? t.expertNoAppointments
              : t.listEmpty}
        </p>
      ) : (
        <BulkAssign eksperte={eksperte} lang={lang} vetemFemijet={!meZgjedhje}>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                {meZgjedhje && <th className="w-10 p-3 pl-4" />}
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
              {terminet.map((termini) => {
                const ngj = categoryStyle(termini.category);
                return (
                <tr key={termini.id} className={`transition ${ngj.rresht}`}>
                  {meZgjedhje && (
                    <td className="relative w-10 p-3 pl-4">
                      <span
                        aria-hidden
                        className={`absolute inset-y-0 left-0 w-1 ${ngj.shirit}`}
                      />
                      <input
                        type="checkbox"
                        name="appointmentIds"
                        value={termini.id}
                        aria-label={termini.name}
                        className="h-4 w-4 rounded border-slate-400"
                      />
                    </td>
                  )}
                  {/* Shiriti me ngjyrë majtas: dallimi kapet edhe me bisht
                      të syrit, pa e ngarkuar rreshtin me ngjyrë të fortë. */}
                  <td className="relative p-3 pl-4 whitespace-nowrap text-slate-600 tabular-nums">
                    {!meZgjedhje && (
                      <span
                        aria-hidden
                        className={`absolute inset-y-0 left-0 w-1 ${ngj.shirit}`}
                      />
                    )}
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
                      <span className="block truncate text-xs text-slate-600">
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
                          : "text-slate-400"
                      }
                    >
                      {termini.contracts_closed}
                    </span>
                  </td>
                  <td className="hidden p-3 text-right text-slate-600 tabular-nums md:table-cell">
                    {noteCounts.get(termini.id) ?? 0}
                  </td>
                  <td className="p-3 pr-4 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${ngj.shenje}`}
                    >
                      {appointmentCategoryLabel(termini.category, t)}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </BulkAssign>
      )}

      {/* Butonat e faqeve. Filtri, pamja dhe kërkimi udhëtojnë bashkë me
          numrin e faqes, që të mos humbin sa herë shtyp «Para». */}
      <Pagination
        faqja={faqja}
        gjithsej={faqeGjithsej}
        t={t}
        adresa={(n) => adresaEListes({ faqe: n })}
      />
    </main>
  );
}
