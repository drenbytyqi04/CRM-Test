"use client";

import { useActionState } from "react";
import { updateClient } from "@/app/actions";
import { STATUSES, type Client, type FormState } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900";

/**
 * Formulari për të ndryshuar të dhënat e një klienti.
 * Shfaqet te pronari i klientit dhe te administratori.
 */
export default function EditForm({ client }: { client: Client }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateClient,
    {}
  );

  return (
    <details className="rounded-xl border border-slate-200 bg-white">
      <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-700 select-none">
        Ndrysho të dhënat
      </summary>

      <form action={action} className="border-t border-slate-200 p-5">
        {/* Fushë e fshehur: cilin klient po ndryshojmë. */}
        <input type="hidden" name="clientId" value={client.id} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Emri <span className="text-red-600">*</span>
            </span>
            <input
              name="name"
              type="text"
              required
              defaultValue={client.name}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Telefoni
            </span>
            <input
              name="phone"
              type="tel"
              defaultValue={client.phone ?? ""}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Emaili
            </span>
            <input
              name="email"
              type="email"
              defaultValue={client.email ?? ""}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Statusi
            </span>
            <select
              name="status"
              defaultValue={client.status}
              className={`${inputClass} bg-white`}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {pending ? "Duke ruajtur..." : "Ruaj ndryshimet"}
          </button>

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}
          {state.message && !pending && (
            <p className="text-sm text-emerald-700">{state.message}</p>
          )}
        </div>
      </form>
    </details>
  );
}
