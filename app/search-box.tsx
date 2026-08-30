import Link from "next/link";
import type { Dict } from "@/lib/i18n";

/**
 * Kutia e kërkimit mbi listë: emri i personit ose numri i shkurtër (#1234).
 *
 * Me faqe, pa kërkim, gjetja e një personi do të thoshte të kalosh faqe pas
 * faqeje. Prandaj kërkimi shkon bashkë me faqosjen, jo pas saj.
 *
 * Është një `<form method="get">` i thjeshtë, pa JavaScript: shkruan dhe
 * shtyp Enter. Filtri i statusit dhe pamja «Të mijat» udhëtojnë si fusha të
 * fshehura, që kërkimi të mos i humbasë.
 */
export default function SearchBox({
  vlera,
  status,
  vetemTeMijat,
  t,
}: {
  vlera: string;
  status: string;
  vetemTeMijat: boolean;
  t: Dict;
}) {
  return (
    <form action="/" method="get" className="flex items-center gap-2">
      {/* Kërkimi i ri nis gjithmonë te faqja e parë: rezultatet janë të
          tjera, prandaj faqja 7 e kërkimit të mëparshëm s'ka kuptim. */}
      {status && <input type="hidden" name="status" value={status} />}
      {vetemTeMijat && <input type="hidden" name="view" value="mine" />}

      <label className="sr-only" htmlFor="kerko">
        {t.searchLabel}
      </label>
      <input
        id="kerko"
        name="kerko"
        type="search"
        defaultValue={vlera}
        placeholder={t.searchPlaceholder}
        className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand sm:w-56"
      />
      <button
        type="submit"
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
      >
        {t.searchButton}
      </button>

      {vlera && (
        <Link
          href={
            [status && `status=${status}`, vetemTeMijat && "view=mine"]
              .filter(Boolean)
              .join("&")
              ? `/?${[status && `status=${status}`, vetemTeMijat && "view=mine"]
                  .filter(Boolean)
                  .join("&")}`
              : "/"
          }
          className="text-sm text-slate-500 underline-offset-2 hover:underline"
        >
          {t.searchClear}
        </Link>
      )}
    </form>
  );
}
