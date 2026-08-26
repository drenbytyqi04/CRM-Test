"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";
import type { FormState } from "@/lib/types";

export default function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    authenticate,
    {}
  );

  return (
    <form
      action={action}
      className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h1 className="text-lg font-semibold text-slate-900">CRM</h1>
      <p className="mt-1 mb-5 text-sm text-slate-500">
        Hyr në llogarinë tënde.
      </p>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Emaili
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ti@shembull.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Fjalëkalimi
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          placeholder="të paktën 6 shenja"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "Duke pritur..." : "Hyr"}
      </button>

      {state.error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
        Nuk ka regjistrim të lirë. Llogarinë ta hap administratori.
      </p>
    </form>
  );
}
