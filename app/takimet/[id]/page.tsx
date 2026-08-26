import Link from "next/link";
import { notFound } from "next/navigation";
import AppointmentForm from "../appointment-form";
import NoteForm from "./note-form";
import NoteItem from "./note-item";
import SignOutButton from "@/app/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  APPOINTMENT_COLUMNS,
  APPOINTMENT_STATUS_CLASSES,
  appointmentStatusLabel,
  formatDate,
  formatDateOnly,
  formatTirane,
  genderLabel,
  toTiraneInput,
  type Appointment,
  type Note,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/** Një fushë e vetme në bllloqet vetëm-lexim. */
function Fusha({ etiketa, vlera }: { etiketa: string; vlera: string | null }) {
  return (
    <div>
      <dt className="text-slate-500">{etiketa}</dt>
      <dd className="mt-1 break-words text-slate-900">{vlera || "—"}</dd>
    </div>
  );
}

export default async function AppointmentPage({
  params,
}: PageProps<"/takimet/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  // Takimin e hap çdo i kyçur; e ndryshon vetëm menaxheri.
  const takimiResult = await supabase
    .from("appointments")
    .select(APPOINTMENT_COLUMNS)
    .eq("id", id)
    .maybeSingle<Appointment>();

  if (takimiResult.error) throw new Error(takimiResult.error.message);

  const takimi = takimiResult.data;
  if (!takimi) notFound();

  const [notesResult, agjentiResult] = await Promise.all([
    supabase
      .from("notes")
      .select("id, appointment_id, user_id, body, created_at, updated_at")
      .eq("appointment_id", takimi.id)
      .order("created_at", { ascending: false })
      .returns<Note[]>(),
    takimi.user_id !== user.id
      ? supabase
          .from("profiles")
          .select("email")
          .eq("id", takimi.user_id)
          .maybeSingle<{ email: string | null }>()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const notes = notesResult.data ?? [];
  const agjenti = agjentiResult.data?.email ?? null;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-sm text-slate-500 transition hover:text-slate-900"
          >
            ← Të gjitha takimet
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {takimi.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                APPOINTMENT_STATUS_CLASSES[takimi.status] ??
                APPOINTMENT_STATUS_CLASSES.cancelled
              }`}
            >
              {appointmentStatusLabel(takimi.status)}
            </span>
            {agjenti && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200 ring-inset">
                Caktuar nga: {agjenti}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatTirane(takimi.scheduled_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      {user.isManager ? (
        <AppointmentForm
          appointment={takimi}
          scheduledDefault={toTiraneInput(takimi.scheduled_at)}
        />
      ) : (
        /* Përdoruesi i thjeshtë e lexon takimin, por nuk e ndryshon. */
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Personalia
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <Fusha etiketa="Numri i klientit" vlera={takimi.customer_number} />
              <Fusha etiketa="Gjinia" vlera={genderLabel(takimi.gender)} />
              <Fusha etiketa="Kombësia" vlera={takimi.nationality} />
              <Fusha
                etiketa="Datëlindja"
                vlera={
                  takimi.birth_date ? formatDateOnly(takimi.birth_date) : null
                }
              />
              <Fusha etiketa="Telefoni" vlera={takimi.phone} />
              <Fusha etiketa="Celulari" vlera={takimi.mobile} />
              <Fusha etiketa="Emaili" vlera={takimi.email} />
              <Fusha etiketa="Rruga" vlera={takimi.street} />
              <Fusha
                etiketa="Vendi"
                vlera={
                  [takimi.postal_code, takimi.city, takimi.canton]
                    .filter(Boolean)
                    .join(", ") || null
                }
              />
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Të dhëna teknike
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <Fusha etiketa="Call center" vlera={takimi.call_center} />
              <Fusha etiketa="Sigurimi aktual" vlera={takimi.current_insurance} />
              <Fusha etiketa="Gjuha" vlera={takimi.language} />
              <Fusha
                etiketa="Data e telefonatës"
                vlera={takimi.call_date ? formatDateOnly(takimi.call_date) : null}
              />
              <Fusha
                etiketa="Numri i personave"
                vlera={String(takimi.persons_count)}
              />
              <Fusha etiketa="Shtuar më" vlera={formatDate(takimi.created_at)} />
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Rezultati
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <Fusha
                etiketa="Statusi"
                vlera={appointmentStatusLabel(takimi.status)}
              />
              <Fusha
                etiketa="Kontrata të mbyllura"
                vlera={String(takimi.contracts_closed)}
              />
              <Fusha
                etiketa="Kontratë shumëvjeçare"
                vlera={takimi.multi_year_contract ? "Po" : "Jo"}
              />
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Detaje të këshillimit
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Fusha etiketa="Detaje familjare" vlera={takimi.family_details} />
              <Fusha etiketa="Trajtim aktual" vlera={takimi.current_treatment} />
              <Fusha etiketa="Lloji i trajtimit" vlera={takimi.treatment_type} />
              <Fusha etiketa="Medikamente" vlera={takimi.medications} />
            </dl>
            <p className="mt-4 text-xs text-slate-500">
              Takimet i cakton dhe i ndryshon vetëm menaxheri. Ti mund të
              shkruash shënime më poshtë.
            </p>
          </section>
        </div>
      )}

      {/* ---------- Shënimet ---------- */}
      <section className="mt-8">
        <div className="mb-4">
          <NoteForm appointmentId={takimi.id} />
        </div>

        <h2 className="mb-3 text-sm font-medium text-slate-500">
          {notes.length} shënime
        </h2>

        {notesResult.error && (
          <p className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Nuk u lexuan dot shënimet: {notesResult.error.message}
          </p>
        )}

        {notes.length === 0 && !notesResult.error ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Ende s&apos;ka shënime për këtë takim.
          </p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                canEdit={user.isAdmin || note.user_id === user.id}
                createdLabel={formatDate(note.created_at)}
                updatedLabel={
                  note.updated_at ? formatDate(note.updated_at) : null
                }
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
