import Link from "next/link";
import { notFound } from "next/navigation";
import AppointmentForm from "../appointment-form";
import SignOutButton from "@/app/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  APPOINTMENT_COLUMNS,
  APPOINTMENT_STATUS_CLASSES,
  CLIENT_COLUMNS,
  appointmentStatusLabel,
  formatDateOnly,
  genderLabel,
  toTiraneInput,
  type Appointment,
  type Client,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/** Një fushë e vetme te blloku i personalive. */
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

  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_COLUMNS)
    .eq("id", id);

  if (!user.isAdmin) query = query.eq("user_id", user.id);

  const takimiResult = await query.maybeSingle<Appointment>();
  if (takimiResult.error) throw new Error(takimiResult.error.message);

  const takimi = takimiResult.data;
  if (!takimi) notFound();

  const [klientiResult, agjentiResult] = await Promise.all([
    supabase
      .from("clients")
      .select(CLIENT_COLUMNS)
      .eq("id", takimi.client_id)
      .maybeSingle<Client>(),
    user.isAdmin && takimi.user_id !== user.id
      ? supabase
          .from("profiles")
          .select("email")
          .eq("id", takimi.user_id)
          .maybeSingle<{ email: string | null }>()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const klienti = klientiResult.data;
  const agjenti = agjentiResult.data?.email ?? null;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/takimet"
            className="text-sm text-slate-500 transition hover:text-slate-900"
          >
            ← Të gjitha takimet
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {klienti?.name ?? "Takim"}
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
                Agjenti: {agjenti}
              </span>
            )}
          </div>
          {klienti && (
            <Link
              href={`/clients/${klienti.id}`}
              className="mt-1 inline-block text-sm text-slate-500 underline transition hover:text-slate-900"
            >
              Hap kartelën e klientit
            </Link>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      {/* ---------- Personalia (nga kartela e klientit) ---------- */}
      {klienti && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Personalia
          </h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <Fusha etiketa="Numri i klientit" vlera={klienti.customer_number} />
            <Fusha etiketa="Gjinia" vlera={genderLabel(klienti.gender)} />
            <Fusha etiketa="Kombësia" vlera={klienti.nationality} />
            <Fusha
              etiketa="Datëlindja"
              vlera={klienti.birth_date ? formatDateOnly(klienti.birth_date) : null}
            />
            <Fusha etiketa="Rruga" vlera={klienti.street} />
            <Fusha etiketa="Kodi postar" vlera={klienti.postal_code} />
            <Fusha etiketa="Kantoni" vlera={klienti.canton} />
            <Fusha etiketa="Qyteti" vlera={klienti.city} />
            <Fusha etiketa="Telefoni" vlera={klienti.phone} />
            <Fusha etiketa="Celulari" vlera={klienti.mobile} />
            <Fusha etiketa="Emaili" vlera={klienti.email} />
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            Këto plotësohen te kartela e klientit, jo këtu.
          </p>
        </section>
      )}

      <AppointmentForm
        clientId={takimi.client_id}
        appointment={takimi}
        scheduledDefault={toTiraneInput(takimi.scheduled_at)}
      />
    </main>
  );
}
