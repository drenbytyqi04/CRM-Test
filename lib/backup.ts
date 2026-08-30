import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Kopja e të dhënave — çfarë merret, dhe si merret pa humbur asgjë.
 *
 * KUJDES, kjo është pika ku një kopje bëhet e padobishme pa u vënë re:
 * PostgREST-i i Supabase-it i pret rreshtat te një kufi i vetin (`max-rows`,
 * zakonisht 1000) DHE NUK JEP GABIM. Një kërkesë e thjeshtë `select("*")` do
 * të kthente 1000 rreshta nga 5000, dhe skeda e shkarkuar do të dukej krejt
 * në rregull. Prandaj lexohet faqe pas faqeje, dhe numri i rreshtave të
 * marrë krahasohet me numrin e vërtetë te baza: nëse s'përputhen, kopja NUK
 * jepet fare. Më mirë asnjë kopje sesa një kopje që gënjen.
 */

/** Sa rreshta merren me një kërkesë. Nën kufirin e parazgjedhur të Supabase-it. */
const FAQJA = 1000;

/** Tabelat që hyjnë te kopja, dhe radha e tyre kur të kthehen mbrapsht. */
export const TABELAT_E_KOPJES = [
  // Së pari profilet: terminet dhe shënimet varen prej tyre.
  "profiles",
  "appointments",
  "notes",
  "appointment_experts",
  "activity_days",
] as const;

export type TabelaEKopjes = (typeof TABELAT_E_KOPJES)[number];

/** Rreshtat e një tabele — të gjithë, ose gabim. */
export async function merrTeGjitha(
  supabase: SupabaseClient,
  tabela: string
): Promise<Record<string, unknown>[]> {
  const rreshta: Record<string, unknown>[] = [];
  let nga = 0;
  let gjithsej: number | null = null;

  for (;;) {
    const { data, error, count } = await supabase
      .from(tabela)
      .select("*", { count: "exact" })
      .range(nga, nga + FAQJA - 1);

    if (error) throw new Error(`${tabela}: ${error.message}`);
    if (gjithsej === null) gjithsej = count ?? null;

    const faqja = (data ?? []) as Record<string, unknown>[];
    rreshta.push(...faqja);

    if (faqja.length < FAQJA) break;
    nga += FAQJA;

    // Rrethore mbrojtëse: pa të, një gabim te faqosja do të sillte një cikël
    // pa fund dhe faqja do të mbetej e varur pa asnjë mesazh.
    if (rreshta.length > 1_000_000) {
      throw new Error(`${tabela}: mbi një milion rreshta — ndalur`);
    }
  }

  if (gjithsej !== null && rreshta.length !== gjithsej) {
    throw new Error(
      `${tabela}: u morën ${rreshta.length} rreshta nga ${gjithsej} që ka baza`
    );
  }
  return rreshta;
}

/** E tërë kopja, tabelë për tabelë. */
export async function merrKopjen(supabase: SupabaseClient) {
  const tabelat: Record<string, Record<string, unknown>[]> = {};
  for (const tabela of TABELAT_E_KOPJES) {
    tabelat[tabela] = await merrTeGjitha(supabase, tabela);
  }
  return {
    /** Që një skedë e ardhshme të njihet edhe pas vitesh. */
    kopje: "crm-termine",
    version: 1,
    krijuar: new Date().toISOString(),
    numrat: Object.fromEntries(
      Object.entries(tabelat).map(([emri, rreshtat]) => [emri, rreshtat.length])
    ),
    tabelat,
  };
}

/**
 * Një tabelë si CSV, e hapshme me Excel.
 *
 * Vlerat mbështillen gjithmonë me thonjëza dhe thonjëzat brenda dyfishohen:
 * te terminet ka adresa me presje dhe shënime me rreshta të rinj, dhe pa këtë
 * një shënim i vetëm do t'i zhvendoste tërë kolonat.
 */
export function siCsv(rreshtat: Record<string, unknown>[]): string {
  if (rreshtat.length === 0) return "";

  // Kolonat merren nga bashkësia e të gjithë rreshtave: nëse njëri ka një
  // fushë që tjetri s'e ka, nuk humbet.
  const kolonat = [...new Set(rreshtat.flatMap((r) => Object.keys(r)))];

  const qeliza = (v: unknown): string => {
    if (v === null || v === undefined) return '""';
    const tekst = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${tekst.replace(/"/g, '""')}"`;
  };

  const rreshti = (r: Record<string, unknown>) =>
    kolonat.map((k) => qeliza(r[k])).join(",");

  // CRLF: Excel-i e pret këtë ndarës rreshtash.
  return [kolonat.map(qeliza).join(","), ...rreshtat.map(rreshti)].join("\r\n");
}

/**
 * Shenja që i thotë Excel-it se skeda është UTF-8.
 *
 * Pa këto tre bajte, Excel-i te Windows-i e lexon skedën me kodimin e vet
 * dhe emrat dalin «Zürich» → «ZÃ¼rich», «Ndërhyrje» → «NdÃ«rhyrje».
 */
export const BOM = "﻿";

/** Emri i skedës: `crm-kopja-2026-08-30.json` */
export function emriISkedes(zgjatimi: string, pjesa = "kopja"): string {
  return `crm-${pjesa}-${new Date().toISOString().slice(0, 10)}.${zgjatimi}`;
}
