"use client";

import { useActionState, useState } from "react";
import { updateNote } from "@/app/actions";
import { type FormState, type Note } from "@/lib/types";

/**
 * Një shënim i vetëm. Butoni "Ndrysho" shfaqet te autori dhe te administratori.
 *
 * Datat vijnë të gatshme si tekst nga serveri, që faqja të mos ndryshojë
 * mes serverit (orë botërore) dhe shfletuesit (orë lokale).
 */
export default function NoteItem({
  note,
  canEdit,
  createdLabel,
  updatedLabel,
}: {
  note: Note;
  canEdit: boolean;
  createdLabel: string;
  updatedLabel: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateNote,
    {}
  );

  const [handled, setHandled] = useState<FormState | null>(null);
  if (state.ok && state !== handled) {
    setHandled(state);
    setEditing(false);
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      {editing ? (
        <form action={action}>
          <input type="hidden" name="noteId" value={note.id} />
          <input type="hidden" name="appointmentId" value={note.appointment_id} />
          <textarea
            name="body"
            data-testid="note-edit"
            rows={3}
            required
            defaultValue={note.body}
            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              data-testid="note-save"
              disabled={pending}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {pending ? "Duke ruajtur..." : "Ruaj"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              Anulo
            </button>
            {state.error && (
              <p className="text-sm text-red-600" role="alert">
                {state.error}
              </p>
            )}
          </div>
        </form>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-slate-900">{note.body}</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-xs text-slate-400">
              {createdLabel}
              {updatedLabel && ` · ndryshuar më ${updatedLabel}`}
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-slate-500 underline transition hover:text-slate-900"
              >
                Ndrysho
              </button>
            )}
          </div>
        </>
      )}
    </li>
  );
}
