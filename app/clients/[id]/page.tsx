import Link from "next/link";
import { notFound } from "next/navigation";
import NoteForm from "./note-form";
import SetupNotice from "@/app/setup-notice";
import { getSupabase, hasSupabaseConfig } from "@/lib/supabase";
import {
  STATUS_CLASSES,
  formatDate,
  statusLabel,
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

  const supabase = getSupabase();

  // Dy kërkesa njëherësh: të dhënat e klientit dhe shënimet e tij.
  const [clientResult, notesResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, phone, email, status, created_at")
      .eq("id", id)
      .maybeSingle<Client>(),
    supabase
      .from("notes")
      .select("id, client_id, body, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .returns<Note[]>(),
  ]);

  if (clientResult.error) {
    throw new Error(clientResult.error.message);
  }

  const client = clientResult.data;
  if (!client) {
    notFound(); // Shfaq faqen "404 – nuk u gjet".
  }

  const notes = notesResult.data ?? [];

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
              <li
                key={note.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="whitespace-pre-wrap text-slate-900">{note.body}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {formatDate(note.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
