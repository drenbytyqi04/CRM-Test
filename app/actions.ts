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

/**
 * A ka të drejtë ky përdorues të prekë këtë klient?
 *
 * Kthen klientin nëse po, ose `null` nëse jo. Administratori i prek të gjithë;
 * të tjerët vetëm të vetët. Kjo kontrollohet edhe këtu, edhe nga rregullat e
 * bazës — dy mbrojtje të pavarura për të njëjtën gjë.
 */
async function findEditableClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  user: { id: string; isAdmin: boolean }
) {
  const { data: client } = await supabase
    .from("clients")
    .select("id, user_id")
    .eq("id", clientId)
    .maybeSingle<{ id: string; user_id: string }>();

  if (!client) return null;
  if (!user.isAdmin && client.user_id !== user.id) return null;
  return client;
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

  if (!(await findEditableClient(supabase, clientId, user))) {
    return { error: "Ky klient nuk u gjet ose nuk ke të drejtë mbi të." };
  }

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

/**
 * Ndryshon të dhënat e një klienti.
 *
 * Administratori e bën këtë për çdo klient, edhe për ata që i ka krijuar
 * dikush tjetër. Përdoruesi i zakonshëm vetëm për klientët e vet.
 */
export async function updateClient(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const clientId = String(formData.get("clientId") ?? "");
  const name = textOrNull(formData.get("name"));
  const phone = textOrNull(formData.get("phone"));
  const email = textOrNull(formData.get("email"));
  const status = String(formData.get("status") ?? "lead");

  if (!clientId) {
    return { error: "Mungon klienti që duhet ndryshuar." };
  }
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

  if (!(await findEditableClient(supabase, clientId, user))) {
    return { error: "Ky klient nuk u gjet ose nuk ke të drejtë mbi të." };
  }

  const { error } = await supabase
    .from("clients")
    .update({ name, phone, email, status })
    .eq("id", clientId);

  if (error) {
    return { error: `Nuk u ruajtën dot ndryshimet: ${error.message}` };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  return { ok: true, message: "Ndryshimet u ruajtën." };
}
