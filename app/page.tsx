import Link from "next/link";
import AppointmentForm from "./terminet/appointment-form";
import SetupNotice from "./setup-notice";
import StatusFilter from "./status-filter";
import DateFilter from "./date-filter";
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
  ditaTjeter,
  eshteDite,
  fillimiIDites,
  formatDuration,
  formatBeograd,
  todayInBeograd,
  type Appointment,
} from "@/lib/types";
import { adresaEListes, type GjendjaEListes } from "@/lib/lista";

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

  const { status, view, kerko, faqe, nga, deri } = await searchParams;
  const filtri = typeof status === "string" ? status : "";
  const kerkimi = typeof kerko === "string" ? kerko.trim() : "";
  // Datat vijnë nga adresa dhe mund të jenë çfarëdo: «dje», «2026-02-31»,
  // gjysma e një date. Çdo gjë që s'është ditë e vërtetë hidhet poshtë dhe
  // trajtohet si e pazgjedhur — më mirë lista e plotë se një filtër që
  // heshtazi nuk kthen asgjë.
  const dataNga = typeof nga === "string" && eshteDite(nga) ? nga : "";
  const dataDeri = typeof deri === "string" && eshteDite(deri) ? deri : "";
  // I kthyer: kush shkruan «nga 10 shtatori deri më 5» do të thotë 5–10.
  // Alternativa — një listë bosh — e lë njeriun të mendojë se s'ka termine.
  const [ditaNga, ditaDeri] =
    dataNga && dataDeri && dataNga > dataDeri
      ? [dataDeri, dataNga]
      : [dataNga, dataDeri];
  const meDate = Boolean(ditaNga || ditaDeri);
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
    .select(APPOINTMENT_COLUMNS, { count: "exact" });

  // Radha ndryshon bashkë me pyetjen që bën njeriu.
  //
  // Pa filtër date, pyetja është «çfarë u shtua së fundi» — prandaj lart rri
  // i fundit i regjistruar. Me filtër date, pyetja është tjetër: «si e kemi
  // të mërkurën». Atë e lexon vetëm një listë e renditur sipas orës së
  // terminit, nga i pari i ditës te i fundit — përndryshe orari i një dite
  // do të dilte i përzier sipas kohës kur dikush e futi te sistemi.
  //
  // Ndarësi i dytë është i detyrueshëm në të dyja rastet, sepse lista është
  // e ndarë në faqe. Dy termine me të njëjtin çast kanë radhë të
  // papërcaktuar: baza mund t'i kthejë ndryshe sa herë, dhe atëherë i njëjti
  // termin del në dy faqe ose në asnjërën. `nr` është unik, prandaj e mbyll.
  query = meDate
    ? query
        .order("scheduled_at", { ascending: true })
        .order("nr", { ascending: true })
    : query
        .order("created_at", { ascending: false })
        .order("nr", { ascending: false });

  if (!showAll) query = query.eq("user_id", user.id);

  // Data e zgjedhur do të thotë ditë e tërë e Beogradit. Fundi është i
  // hapur — «< fillimi i ditës pasardhëse» — sepse «deri më 5» duhet t'i
  // marrë edhe terminet e orës 17:00 të asaj dite; me `<= 5` do të mbetej
  // vetëm mesnata.
  const nisja = ditaNga ? fillimiIDites(ditaNga) : null;
  const fundi = ditaDeri ? fillimiIDites(ditaTjeter(ditaDeri)) : null;
  if (nisja) query = query.gte("scheduled_at", nisja);
  if (fundi) query = query.lt("scheduled_at", fundi);
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
  const rreshtiIPare = (faqjaEKerkuar - 1) * FAQE_MADHESIA;
  const terminetResult = await query
    .range(rreshtiIPare, rreshtiIPare + FAQE_MADHESIA - 1)
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
  // Të gjitha zgjedhjet e listës në një vend. Adresën e ndërton vetëm
  // `adresaEListes` te `lib/lista.ts`, dhe të gjitha pjesët e faqes — menyja
  // e rezultatit, kutia e kërkimit, filtri i datës, butonat e faqeve — e
  // thërrasin atë. Kështu asnjëra s'i harron zgjedhjet e tjetrës.
  //
  // `view` ka kuptim vetëm aty ku ka çelës: te menaxheri dhe admini. Për të
  // tjerët do të ishte një parametër që s'ndryshon asgjë.
  const gjendja: GjendjaEListes = {
    status: filtri,
    vetemTeMijat: user.isManager && !showAll,
    kerko: kerkimi,
    nga: ditaNga,
    deri: ditaDeri,
  };
  const adresa = (
    ndryshimi: Partial<GjendjaEListes> & { faqe?: number } = {}
  ) => adresaEListes(gjendja, ndryshimi);

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
    // Filtri i datës i kalohet edhe këtu, dhe kjo nuk është hollësi: pa të,
    // lista poshtë do të tregonte terminet e një jave, kurse tre numrat lart
    // do të mbeteshin të gjithë bazës. Dy të vërteta të ndryshme në të
    // njëjtin ekran janë më keq se asnjë numër fare.
    supabase
      .rpc("appointments_summary", {
        p_user: showAll ? null : user.id,
        p_category: kategoriaIVlefshme ? filtri : null,
        p_search: kerkimi || null,
        p_from: nisja,
        p_to: fundi,
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

  // Shiriti i zgjedhjes duket për menaxherin dhe adminin, dhe vetëm nëse ka
  // të kujt t'ia japë. Kufiri i vërtetë rri te baza; kjo është thjesht pamje.
  const eksperte = user.isManager
    ? (agjentetResult.data ?? [])
        .filter((p) => p.role === "expert")
        .map((p) => ({ id: p.id, email: p.email ?? "—" }))
    : [];
  const meZgjedhje = user.isManager && eksperte.length > 0;

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
              href={adresa({ vetemTeMijat: false })}
              className={`rounded-lg px-3 py-1.5 transition ${
                showAll
                  ? "bg-brand text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-white"
              }`}
            >
              {t.listAll}
            </Link>
            <Link
              href={adresa({ vetemTeMijat: true })}
              className={`rounded-lg px-3 py-1.5 transition ${
                showAll
                  ? "border border-slate-300 text-slate-600 hover:bg-white"
                  : "bg-brand text-white"
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

      <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusFilter gjendja={gjendja} lang={lang} />
          <SearchBox gjendja={gjendja} t={t} />
        </div>
        <div className="border-t border-slate-100 pt-3">
          <DateFilter gjendja={gjendja} lang={lang} />
        </div>
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
            : meDate
              ? t.dateNoResult
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
        adresa={(n) => adresa({ faqe: n })}
      />
    </main>
  );
}
