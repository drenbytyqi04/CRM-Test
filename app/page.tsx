import Link from "next/link";
import ClientForm from "./client-form";
import SetupNotice from "./setup-notice";
import { getSupabase, hasSupabaseConfig } from "@/lib/supabase";
import { STATUS_CLASSES, statusLabel, type Client } from "@/lib/types";

// I thotë Next.js-it ta ndërtojë faqen sa herë hapet, që lista të jetë e freskët.
export const dynamic = "force-dynamic";

/** Klienti bashkë me numrin e shënimeve të tij. */
type ClientRow = Client & { notes: { count: number }[] };

export default async function Page() {
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

  const supabase = getSupabase();

  // Marrim klientët, më i riu i pari, bashkë me numrin e shënimeve.
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, phone, email, status, created_at, notes(count)")
    .order("created_at", { ascending: false })
    .returns<ClientRow[]>();

  const clients = data ?? [];

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Klientët
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Shto klientë dhe mbaj shënime për secilin.
        </p>
      </header>

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
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {client.notes[0]?.count ?? 0} shënime
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
