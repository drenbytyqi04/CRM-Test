"use client";

import { useActionState, useEffect, useRef } from "react";
import { addNote } from "@/app/actions";
import type { FormState } from "@/lib/types";

/**
 * Formulari për të shtuar një shënim te një takim.
 * E përdorin të gjithë — edhe përdoruesi që s'i ndryshon dot takimet.
 */
export default function NoteForm({ appointmentId }: { appointmentId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(
    addNote,
    {}
  );

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <input type="hidden" name="appointmentId" value={appointmentId} />

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Shënim i ri
        </span>
        <textarea
          name="body"
          rows={3}
          required
          placeholder="P.sh. Biseduam në telefon, kërkon ofertë deri të premten."
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
        />
      </label>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Duke ruajtur..." : "Ruaj shënimin"}
        </button>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
