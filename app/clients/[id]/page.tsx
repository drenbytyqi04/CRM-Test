import Link from "next/link";
import { notFound } from "next/navigation";
import NoteForm from "./note-form";
import EditForm from "./edit-form";
import NoteItem from "./note-item";
import SetupNotice from "@/app/setup-notice";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import AppointmentForm from "@/app/takimet/appointment-form";
import {
  APPOINTMENT_COLUMNS,
  APPOINTMENT_STATUS_CLASSES,
  CLIENT_COLUMNS,
  STATUS_CLASSES,
  appointmentStatusLabel,
  defaultAppointmentSlot,
  formatDate,
  formatDateOnly,
  formatTirane,
  genderLabel,
  statusLabel,
  type Appointment,
  type Client,
  type Note,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  // Në Next.js 16 `params` vjen si premtim (Promise), prandaj përdorim `await`.
  const { id } = await params;

  if (!hasSupabaseConfig()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <SetupNotice />
      </main>
    );
  }

  const user = await requireUser();
  const supabase = await createClient();

  // Së pari klienti. Administratori e hap çdo klient; të tjerët vetëm të vetët.
  let clientQuery = supabase
    .from("clients")
    .select(CLIENT_COLUMNS)
    .eq("id", id);

  if (!user.isAdmin) {
    clientQuery = clientQuery.eq("user_id", user.id);
  }

  const clientResult = await clientQuery.maybeSingle<Client>();

  if (clientResult.error) {
    throw new Error(clientResult.error.message);
  }

  const client = clientResult.data;
  if (!client) {
    notFound(); // Shfaq faqen "404 – nuk u gjet".
  }

  // Pastaj shënimet. Këtu nuk filtrojmë sipas autorit: te një klient i imi
  // dua t'i shoh të gjitha shënimet, edhe ato që i ka shkruar administratori.
  // Deri këtu kemi vërtetuar tashmë se kemi të drejtë mbi këtë klient.
  const [notesResult, ownerResult, takimetResult] = await Promise.all([
    supabase
      .from("notes")
      .select("id, client_id, user_id, body, created_at, updated_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .returns<Note[]>(),
    // Administratorit i tregojmë se kujt i përket klienti.
    user.isAdmin && client.user_id !== user.id
      ? supabase
          .from("profiles")
          .select("email")
          .eq("id", client.user_id)
          .maybeSingle<{ email: string | null }>()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("appointments")
      .select(APPOINTMENT_COLUMNS)
      .eq("client_id", client.id)
      .order("scheduled_at", { ascending: false })
      .returns<Appointment[]>(),
  ]);

  const notes = notesResult.data ?? [];
  const takimet = takimetResult.data ?? [];
  const ownerEmail = ownerResult.data?.email ?? null;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <Link
        href="/"
        className="text-sm text-slate-500 transition hover:text-slate-900"
      >
        ← Të gjithë klientët
      </Link>

      <header className="mt-4 mb-8 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {client.name}
        </h1>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
            STATUS_CLASSES[client.status] ?? STATUS_CLASSES.inactive
          }`}
        >
          {statusLabel(client.status)}
        </span>
        {ownerEmail && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200 ring-inset">
            Klient i {ownerEmail}
          </span>
        )}
      </header>

      <dl className="mb-8 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Telefoni</dt>
          <dd className="mt-1 text-slate-900">{client.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Emaili</dt>
          <dd className="mt-1 break-all text-slate-900">{client.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Shtuar më</dt>
          <dd className="mt-1 text-slate-900">{formatDate(client.created_at)}</dd>
        </div>
      </dl>

      <dl className="mb-8 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Numri i klientit</dt>
          <dd className="mt-1 text-slate-900">{client.customer_number || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Gjinia</dt>
          <dd className="mt-1 text-slate-900">{genderLabel(client.gender)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Kombësia</dt>
          <dd className="mt-1 text-slate-900">{client.nationality || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Datëlindja</dt>
          <dd className="mt-1 text-slate-900">
            {client.birth_date ? formatDateOnly(client.birth_date) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Celulari</dt>
          <dd className="mt-1 text-slate-900">{client.mobile || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Adresa</dt>
          <dd className="mt-1 text-slate-900">
            {[client.street, client.postal_code, client.city, client.canton]
              .filter(Boolean)
              .join(", ") || "—"}
          </dd>
        </div>
      </dl>

      <div className="mb-8">
        <EditForm client={client} />
      </div>

      {/* ---------- Takimet ---------- */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-slate-500">
          {takimet.length} takime
        </h2>

        {takimet.length > 0 && (
          <ul className="mb-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {takimet.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/takimet/${t.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-slate-900">
                      {formatTirane(t.scheduled_at)}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {t.persons_count} persona
                      {t.current_insurance ? ` · ${t.current_insurance}` : ""}
                      {t.contracts_closed > 0
                        ? ` · ${t.contracts_closed} kontrata`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      APPOINTMENT_STATUS_CLASSES[t.status] ??
                      APPOINTMENT_STATUS_CLASSES.cancelled
                    }`}
                  >
                    {appointmentStatusLabel(t.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <details className="rounded-xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-700 select-none">
            Cakto takim të ri
          </summary>
          <div className="border-t border-slate-200 p-5">
            <AppointmentForm
              clientId={client.id}
              scheduledDefault={defaultAppointmentSlot()}
            />
          </div>
        </details>
      </section>

      <NoteForm clientId={client.id} />

      {notesResult.error && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Nuk u lexuan dot shënimet: {notesResult.error.message}
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-slate-500">
          {notes.length} shënime
        </h2>

        {notes.length === 0 && !notesResult.error ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Ende s&apos;ka shënime për këtë klient.
          </p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                // Shënimin e ndryshon autori i tij, ose administratori.
                canEdit={user.isAdmin || note.user_id === user.id}
                createdLabel={formatDate(note.created_at)}
                updatedLabel={note.updated_at ? formatDate(note.updated_at) : null}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
