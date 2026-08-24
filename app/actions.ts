"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { STATUSES, type FormState } from "@/lib/types";

/**
 * "use server" lart në skedë do të thotë: këto funksione ekzekutohen VETËM
 * në server. Formularët në shfletues i thërrasin ato.
 *
 * Kujdes: këto funksione mund të thirren edhe drejtpërdrejt, jo vetëm nga
 * faqja jonë. Prandaj secili prej tyre e kontrollon vetë se kush është i
 * kyçur — nuk mjafton që faqja të jetë e mbrojtur.
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

/** Shton një klient të ri për përdoruesin e kyçur. */
export async function addClient(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const name = textOrNull(formData.get("name"));
  const phone = textOrNull(formData.get("phone"));
  const email = textOrNull(formData.get("email"));
  const status = String(formData.get("status") ?? "lead");

  if (!name) {
    return { error: "Emri është i detyrueshëm." };
  }
  if (email && !looksLikeEmail(email)) {
    return { error: "Emaili nuk duket i saktë (shembull: emri@shembull.com)." };
  }
  if (!STATUSES.some((s) => s.value === status)) {
    return { error: "Statusi i zgjedhur nuk njihet." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .insert({ name, phone, email, status, user_id: user.id });

  if (error) {
    return { error: `Nuk u ruajt dot klienti: ${error.message}` };
  }

  revalidatePath("/");
  return { ok: true };
}

/** Shton një shënim te një klient i caktuar. */
export async function addNote(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const clientId = String(formData.get("clientId") ?? "");
  const body = textOrNull(formData.get("body"));

  if (!clientId) {
    return { error: "Mungon klienti të cilit i përket shënimi." };
  }
  if (!body) {
    return { error: "Shënimi nuk mund të jetë bosh." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .insert({ client_id: clientId, body, user_id: user.id });

  if (error) {
    return { error: `Nuk u ruajt dot shënimi: ${error.message}` };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  return { ok: true };
}
