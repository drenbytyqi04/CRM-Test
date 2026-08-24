"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import { STATUSES, type FormState } from "@/lib/types";

/**
 * "use server" lart në skedë do të thotë: këto funksione ekzekutohen VETËM
 * në server. Formularët në shfletues i thërrasin ato, por kodi (dhe çelësi
 * sekret i Supabase) nuk zbret kurrë te vizitori.
 */

/** Heq hapësirat e tepërta dhe kthen null nëse fusha ka mbetur bosh. */
function textOrNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

/** Kontroll shumë i thjeshtë i formatit të emailit: diçka@diçka.diçka */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Shton një klient të ri.
 * Merr `prevState` si argument të parë sepse thirret nga `useActionState`.
 */
export async function addClient(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = textOrNull(formData.get("name"));
  const phone = textOrNull(formData.get("phone"));
  const email = textOrNull(formData.get("email"));
  const status = String(formData.get("status") ?? "lead");

  // --- Kontrollet para se t'i ruajmë të dhënat ---
  if (!name) {
    return { error: "Emri është i detyrueshëm." };
  }
  if (email && !looksLikeEmail(email)) {
    return { error: "Emaili nuk duket i saktë (shembull: emri@shembull.com)." };
  }
  if (!STATUSES.some((s) => s.value === status)) {
    return { error: "Statusi i zgjedhur nuk njihet." };
  }

  // --- Ruajtja në Supabase ---
  const supabase = getSupabase();
  const { error } = await supabase
    .from("clients")
    .insert({ name, phone, email, status });

  if (error) {
    return { error: `Nuk u ruajt dot klienti: ${error.message}` };
  }

  // I themi Next.js-it që lista e klientëve ndryshoi, që faqja të rifreskohet.
  revalidatePath("/");
  return { ok: true };
}

/** Shton një shënim te një klient i caktuar. */
export async function addNote(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const clientId = String(formData.get("clientId") ?? "");
  const body = textOrNull(formData.get("body"));

  if (!clientId) {
    return { error: "Mungon klienti të cilit i përket shënimi." };
  }
  if (!body) {
    return { error: "Shënimi nuk mund të jetë bosh." };
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("notes")
    .insert({ client_id: clientId, body });

  if (error) {
    return { error: `Nuk u ruajt dot shënimi: ${error.message}` };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  return { ok: true };
}
