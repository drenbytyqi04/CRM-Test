import Link from "next/link";
import ClientForm from "./client-form";
import SetupNotice from "./setup-notice";
import SignOutButton from "./sign-out-button";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { STATUS_CLASSES, statusLabel, type Client } from "@/lib/types";

// I thotë Next.js-it ta ndërtojë faqen sa herë hapet, që lista të jetë e freskët.
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps<"/">) {
  // Nëse çelësat mungojnë, tregojmë udhëzimet në vend të një gabimi.
  if (!hasSupabaseConfig()) {
    return (
      <main className="mx-auto w-full max-w-4xl px-5 py-10">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900">
          Klientët
        </h1>
        <SetupNotice />
      </main>
    );
  }

  // Kush është i kyçur? Nëse askush, na dërgon te faqja e hyrjes.
  const user = await requireUser();
  const supabase = await createClient();

  // Administratori i sheh të gjitha si parazgjedhje, por mund të kalojë
  // te "Të mijat" me anë të lidhjes lart.
  const { view } = await searchParams;
  const showAll = user.isAdmin && view !== "mine";

  // Dy mbrojtje njëkohësisht: rregullat e bazës (RLS) e ndalojnë leximin e
  // rreshtave të të tjerëve, dhe ne e kërkojmë shprehimisht `user_id`-në tonë
  // (përveç administratorit, kur ai po i shikon të gjitha).
  let clientsQuery = supabase
    .from("clients")
    .select("id, user_id, name, phone, email, status, created_at")
    .order("created_at", { ascending: false });

  let notesQuery = supabase.from("notes").select("client_id");

  if (!showAll) {
    clientsQuery = clientsQuery.eq("user_id", user.id);
    notesQuery = notesQuery.eq("user_id", user.id);
  }

  const [clientsResult, notesResult, ownersResult] = await Promise.all([
    clientsQuery.returns<Client[]>(),
    notesQuery.returns<{ client_id: string }[]>(),
    showAll
      ? supabase
          .from("profiles")
          .select("id, email")
          .returns<{ id: string; email: string | null }[]>()
      : Promise.resolve({ data: [], error: null }),
  ]);

  const clients = clientsResult.data ?? [];
  const error = clientsResult.error;

  // Numërojmë sa shënime ka secili klient.
  const noteCounts = new Map<string, number>();
  for (const note of notesResult.data ?? []) {
    noteCounts.set(note.client_id, (noteCounts.get(note.client_id) ?? 0) + 1);
  }

  // Emaili i pronarit për secilin klient (vetëm në pamjen e administratorit).
  const owners = new Map<string, string>();
  for (const owner of ownersResult.data ?? []) {
    owners.set(owner.id, owner.email ?? "—");
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Klientët
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {showAll
              ? "Po shikon të dhënat e të gjithë përdoruesve."
              : "Shto klientë dhe mbaj shënime për secilin."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {user.isAdmin && (
            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-white"
            >
              Përdoruesit
            </Link>
          )}
          <span className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            {user.email}
            {user.isAdmin && (
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                Admin
              </span>
            )}
          </span>
          <SignOutButton />
        </div>
      </header>

      {user.isAdmin && (
        <nav className="mb-6 flex gap-2 text-sm">
          <Link
            href="/?view=all"
            className={`rounded-lg px-3 py-1.5 transition ${
              showAll
                ? "bg-slate-900 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-white"
            }`}
          >
            Të gjitha
          </Link>
          <Link
            href="/?view=mine"
            className={`rounded-lg px-3 py-1.5 transition ${
              showAll
                ? "border border-slate-300 text-slate-600 hover:bg-white"
                : "bg-slate-900 text-white"
            }`}
          >
            Të mijat
          </Link>
        </nav>
      )}

      <ClientForm />

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Nuk u lexuan dot klientët: {error.message}
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-slate-500">
          {clients.length} klientë
        </h2>

        {clients.length === 0 && !error ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Ende s&apos;ka klientë. Shto të parin me formularin lart.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {clients.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {client.name}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {[client.phone, client.email].filter(Boolean).join(" · ") ||
                        "Pa kontakt"}
                    </p>
                    {showAll && (
                      <p className="mt-1 truncate text-xs text-slate-400">
                        Pronari: {owners.get(client.user_id) ?? "—"}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {noteCounts.get(client.id) ?? 0} shënime
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        STATUS_CLASSES[client.status] ?? STATUS_CLASSES.inactive
                      }`}
                    >
                      {statusLabel(client.status)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
