"use client";

import { useRouter } from "next/navigation";
import { APPOINTMENT_CATEGORIES } from "@/lib/types";
import { DICTS, type Lang } from "@/lib/i18n";

/**
 * Filtri i rezultatit: tri kategoritë.
 *
 * Më parë ishin nëntë statuse. Tani lista ndahet në tri kategori, dhe arsyeja
 * e hollësishme rri brenda terminit.
 *
 * Pamja "Të mijat" ruhet: ndryshimi i statusit nuk të kthen te të gjitha.
 */
export default function StatusFilter({
  vlera,
  vetemTeMijat,
  kerkimi,
  lang,
}: {
  vlera: string;
  vetemTeMijat: boolean;
  /** Teksti i kërkuar, që ndërrimi i statusit të mos e humbasë. */
  kerkimi: string;
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">{t.filterStatus}</span>
      <select
        data-testid="status-filter"
        value={vlera}
        onChange={(e) => {
          // Statusi i ri nis nga faqja e parë: rezultatet janë të tjera,
          // prandaj `faqe` bie qëllimisht.
          const params = new URLSearchParams();
          if (e.target.value) params.set("status", e.target.value);
          if (vetemTeMijat) params.set("view", "mine");
          if (kerkimi) params.set("kerko", kerkimi);
          const q = params.toString();
          router.push(q ? `/?${q}` : "/");
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 outline-none focus:border-brand"
      >
        <option value="">{t.filterAll}</option>
        {APPOINTMENT_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {t[c.key]}
          </option>
        ))}
      </select>
    </label>
  );
}
