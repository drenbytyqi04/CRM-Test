import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppointmentForm from "./appointment-form";
import NoteForm from "./note-form";
import NoteRow from "./note-row";
import { Tabs, TabPanel } from "./tabs";
import DeleteButton from "./delete-button";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  APPOINTMENT_COLUMNS,
  APPOINTMENT_STATUS_CLASSES,
  appointmentStatusLabel,
  appointmentPath,
  formatDate,
  formatDateOnly,
  formatBeograd,
  genderLabel,
  toBeogradInput,
  type Appointment,
  type Note,
  type RolePrefix,
} from "@/lib/types";

/** Një fushë e vetme në bllloqet vetëm-lexim. */
function Fusha({ etiketa, vlera }: { etiketa: string; vlera: string | null }) {
  return (
    <div>
      <dt className="text-slate-500">{etiketa}</dt>
      <dd className="mt-1 break-words text-slate-900">{vlera || "—"}</dd>
    </div>
  );
}

/**
 * Faqja e një termini. E njëjta faqe shërbehet nën tri adresa — `/admin/`,
 * `/menager/` dhe `/user/` — sepse secili rol e ka prefiksin e vet.
 *
 * `prefiks` thotë vetëm se nga cila adresë erdhi kërkesa. Lejet nuk varen
 * kurrë prej saj: ato dalin nga roli i vërtetë te `profiles`. Nëse prefiksi
 * s'i përgjigjet rolit, përdoruesi dërgohet te adresa e vet.
 */
export default async function AppointmentPage({
  nr,
  prefiks,
}: {
  nr: string;
  prefiks: RolePrefix;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  // Adresa mban numrin e shkurtër (`/admin/terminet/1001`). Lidhjet e vjetra
  // e kanë `id`-në e gjatë brenda, prandaj i njohim të dyja format.
  const eshteNumer = /^\d+$/.test(nr);

  // Terminin e hap çdo i kyçur; e ndryshon vetëm menaxheri.
  const kerkesa = supabase.from("appointments").select(APPOINTMENT_COLUMNS);
  const terminiResult = await (
    eshteNumer ? kerkesa.eq("nr", Number(nr)) : kerkesa.eq("id", nr)
  ).maybeSingle<Appointment>();

  if (terminiResult.error) throw new Error(terminiResult.error.message);

  const termini = terminiResult.data;
  if (!termini) notFound();

  // Adresa e drejtë për këtë përdorues dhe këtë termin: prefiksi i rolit të
  // vet dhe numri i shkurtër. Nëse ajo që u shkrua është tjetër — prefiks i
  // gabuar, ose `id`-ja e gjatë e një lidhjeje të vjetër — e dërgojmë atje.
  const adresaEDrejte = appointmentPath(termini, user.role);
  if (`/${prefiks}/terminet/${nr}` !== adresaEDrejte) redirect(adresaEDrejte);

  const [notesResult, profilesResult] = await Promise.all([
    supabase
      .from("notes")
      .select("id, appointment_id, user_id, body, created_at, updated_at")
      .eq("appointment_id", termini.id)
      .order("created_at", { ascending: false })
      .returns<Note[]>(),
    supabase
      .from("profiles")
      .select("id, email")
      .returns<{ id: string; email: string | null }[]>(),
  ]);

  const notes = notesResult.data ?? [];

  // Emri i shfaqur për secilin autor. Nëse rregullat e bazës nuk e lejojnë
  // leximin e emailit të tjetrit, mbetet një vizë.
  const emailet = new Map(
    (profilesResult.data ?? []).map((p) => [p.id, p.email ?? "—"])
  );
  const autorLabel = (id: string) =>
    id === user.id ? user.email : (emailet.get(id) ?? "—");

  const agjenti =
    termini.user_id === user.id ? null : (emailet.get(termini.user_id) ?? null);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <header className="mb-6">
        <div>
          <Link
            href="/"
            className="text-sm text-slate-500 transition hover:text-slate-900"
          >
            ← Të gjitha terminet
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {termini.nr != null && (
                <span className="mr-2 font-normal text-slate-400">
                  #{termini.nr}
                </span>
              )}
              {termini.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                APPOINTMENT_STATUS_CLASSES[termini.status] ??
                APPOINTMENT_STATUS_CLASSES.cancelled
              }`}
            >
              {appointmentStatusLabel(termini.status)}
            </span>
            {agjenti && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200 ring-inset">
                Caktuar nga: {agjenti}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatBeograd(termini.scheduled_at)}
          </p>
          {/* Koha e regjistrimit e sheh çdo rol, jo vetëm përdoruesi. */}
          <p className="mt-0.5 text-xs text-slate-400">
            Regjistruar më {formatDate(termini.created_at)} · ora e Beogradit
          </p>
        </div>
      </header>

      <Tabs
        tabs={[
          { id: "personalia", label: "Personalia" },
          { id: "teknike", label: "Të dhëna teknike" },
          { id: "rezultati", label: "Rezultati" },
          { id: "detaje", label: "Detaje" },
          { id: "feedback", label: `Feedback (${notes.length})` },
        ]}
      >
      {user.isManager ? (
        <AppointmentForm
          appointment={termini}
          scheduledDefault={toBeogradInput(termini.scheduled_at)}
        />
      ) : (
        /* Përdoruesi i thjeshtë e lexon terminin, por nuk e ndryshon. */
        <div className="space-y-6">
          <TabPanel id="personalia">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Personalia
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <Fusha etiketa="Numri i klientit" vlera={termini.customer_number} />
              <Fusha etiketa="Gjinia" vlera={genderLabel(termini.gender)} />
              <Fusha etiketa="Kombësia" vlera={termini.nationality} />
              <Fusha
                etiketa="Datëlindja"
                vlera={
                  termini.birth_date ? formatDateOnly(termini.birth_date) : null
                }
              />
              <Fusha etiketa="Telefoni" vlera={termini.phone} />
              <Fusha etiketa="Celulari" vlera={termini.mobile} />
              <Fusha etiketa="Emaili" vlera={termini.email} />
              <Fusha etiketa="Rruga" vlera={termini.street} />
              <Fusha
                etiketa="Vendi"
                vlera={
                  [termini.postal_code, termini.city, termini.canton]
                    .filter(Boolean)
                    .join(", ") || null
                }
              />
            </dl>
          </section>

          </TabPanel>

          <TabPanel id="teknike">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Të dhëna teknike
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <Fusha etiketa="Call center" vlera={termini.call_center} />
              <Fusha etiketa="Sigurimi aktual" vlera={termini.current_insurance} />
              <Fusha etiketa="Gjuha" vlera={termini.language} />
              <Fusha
                etiketa="Data e telefonatës"
                vlera={termini.call_date ? formatDateOnly(termini.call_date) : null}
              />
              <Fusha
                etiketa="Numri i personave"
                vlera={String(termini.persons_count)}
              />
              <Fusha etiketa="Shtuar më" vlera={formatDate(termini.created_at)} />
            </dl>
          </section>

          </TabPanel>

          <TabPanel id="rezultati">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Rezultati
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <Fusha
                etiketa="Statusi"
                vlera={appointmentStatusLabel(termini.status)}
              />
              <Fusha
                etiketa="Kontrata të mbyllura"
                vlera={String(termini.contracts_closed)}
              />
              <Fusha
                etiketa="Kontratë shumëvjeçare"
                vlera={termini.multi_year_contract ? "Po" : "Jo"}
              />
            </dl>
          </section>

          </TabPanel>

          <TabPanel id="detaje">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Detaje të këshillimit
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Fusha etiketa="Detaje familjare" vlera={termini.family_details} />
              <Fusha etiketa="Trajtim aktual" vlera={termini.current_treatment} />
              <Fusha etiketa="Lloji i trajtimit" vlera={termini.treatment_type} />
              <Fusha etiketa="Medikamente" vlera={termini.medications} />
            </dl>
            <p className="mt-4 text-xs text-slate-500">
              Terminet i cakton dhe i ndryshon vetëm menaxheri. Ti mund të
              shkruash shënime te skeda «Feedback».
            </p>
          </section>
          </TabPanel>
        </div>
      )}

      {/* ---------- Shënimet ---------- */}
      <TabPanel id="feedback">
      <section>
        <div className="mb-4">
          <NoteForm appointmentId={termini.id} />
        </div>

        {notesResult.error && (
          <p className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Nuk u lexuan dot shënimet: {notesResult.error.message}
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="p-4 font-medium whitespace-nowrap">Përdoruesi</th>
                <th className="p-4 font-medium">Shënimi</th>
                <th className="p-4 font-medium whitespace-nowrap">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {notes.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    Ende s&apos;ka shënime për këtë termin.
                  </td>
                </tr>
              ) : (
                notes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    autori={autorLabel(note.user_id)}
                    canEdit={user.isAdmin || note.user_id === user.id}
                    createdLabel={formatDate(note.created_at)}
                    updatedLabel={
                      note.updated_at ? formatDate(note.updated_at) : null
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {notes.length} shënime · Ctrl+Enter te kutia lart e ruan menjëherë.
        </p>
      </section>
      </TabPanel>
      </Tabs>

      {/* Fshirja rri jashtë skedave dhe në fund: veprim i rrallë, i pakthyeshëm. */}
      {user.isManager && (
        <DeleteButton
          appointmentId={termini.id}
          emri={termini.name}
          numriIShenimeve={notes.length}
        />
      )}
    </main>
  );
}
