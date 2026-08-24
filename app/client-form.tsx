"use client";

import { useActionState, useEffect, useRef } from "react";
import { addClient } from "./actions";
import { STATUSES, type FormState } from "@/lib/types";

/**
 * "use client" = ky komponent ekzekutohet edhe në shfletues, sepse ka nevojë
 * për ndërveprim (të tregojë gabime dhe të pastrojë formularin pas ruajtjes).
 */
export default function ClientForm() {
  const formRef = useRef<HTMLFormElement>(null);

  // state  -> përgjigjja e fundit nga serveri ({ ok } ose { error })
  // action -> funksioni që i jepet formularit
  // pending-> true derisa serveri po e përpunon kërkesën
  const [state, action, pending] = useActionState<FormState, FormData>(
    addClient,
    {}
  );

  // Kur ruajtja shkon mirë, i zbrazim fushat që të shtosh klientin tjetër.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="mb-4 text-base font-semibold text-slate-900">
        Shto klient të ri
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Emri <span className="text-red-600">*</span>
          </span>
          <input
            name="name"
            type="text"
            required
            placeholder="Arben Krasniqi"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Telefoni
          </span>
          <input
            name="phone"
            type="tel"
            placeholder="+383 44 123 456"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Emaili
          </span>
          <input
            name="email"
            type="email"
            placeholder="arben@shembull.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Statusi
          </span>
          <select
            name="status"
            defaultValue="lead"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
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
          {pending ? "Duke ruajtur..." : "Shto klientin"}
        </button>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        {state.ok && !pending && (
          <p className="text-sm text-emerald-700">Klienti u shtua.</p>
        )}
      </div>
    </form>
  );
}
