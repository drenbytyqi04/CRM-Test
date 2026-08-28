"use client";

import { useActionState, useState } from "react";
import { deleteUserAccount } from "./actions";
import type { FormState } from "@/lib/types";

/**
 * Fshirja e një llogarie — vetëm te faqja e adminit.
 *
 * Kërkon dy klikime, dhe i thotë hapur çfarë humbet. Kur llogaria ka
 * termine ose shënime, jepen dy rrugë: t'i marrësh ato te vetja, ose t'i
 * fshish bashkë me llogarinë. E para është e para me qëllim — humbja e
 * padashur e të dhënave është gabimi më i shtrenjtë këtu.
 */
export default function DeleteUser({
  userId,
  email,
  termine,
  shenime,
  vetja,
}: {
  userId: string;
  email: string;
  termine: number;
  shenime: number;
  /** Rreshti im — nuk e fshij dot veten. */
  vetja: boolean;
}) {
  const [pyet, setPyet] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    deleteUserAccount,
    {}
  );

  if (vetja) {
    return <span className="text-xs text-slate-400">ti</span>;
  }

  if (state.ok) {
    return <span className="text-xs text-emerald-700">u fshi</span>;
  }

  if (!pyet) {
    return (
      <button
        type="button"
        onClick={() => setPyet(true)}
        className="text-xs text-red-700 underline underline-offset-2 transition hover:text-red-900"
      >
        Fshi
      </button>
    );
  }

  const kaTeDhena = termine > 0 || shenime > 0;

  // Dritare në qendër, jo panel brenda qelizës: te tabela ajo dilte jashtë
  // dhe pritej në skaj, prandaj gjysma e butonave nuk dukej fare.
  return (
    <>
      <button
        type="button"
        onClick={() => setPyet(false)}
        aria-label="Mbyll"
        className="fixed inset-0 z-40 cursor-default bg-slate-900/30"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-4 top-1/3 z-50 mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-5 text-left shadow-xl"
      >
        <p className="text-base font-semibold text-slate-900">
          Ta fshij {email}?
        </p>

        {kaTeDhena ? (
          <p className="mt-2 text-sm text-slate-600">
            Kjo llogari ka <strong>{termine} termine</strong> dhe{" "}
            <strong>{shenime} shënime</strong>. Ato fshihen bashkë me të, veç
            nëse i merr te vetja. Nuk kthehet mbrapsht.
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Nuk ka asnjë termin e asnjë shënim. Nuk kthehet mbrapsht.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {kaTeDhena && (
            <form action={action}>
              <input type="hidden" name="userId" value={userId} />
              <input type="hidden" name="kaloTeUne" value="1" />
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                Merri të dhënat te unë, pastaj fshije
              </button>
            </form>
          )}

          <form action={action}>
            <input type="hidden" name="userId" value={userId} />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {pending
                ? "Duke fshirë..."
                : kaTeDhena
                  ? "Fshij llogarinë bashkë me të dhënat"
                  : "Po, fshije"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setPyet(false)}
            disabled={pending}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Anulo
          </button>
        </div>

        {state.error && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </>
  );
}
