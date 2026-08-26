"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireUser } from "@/lib/auth";
import {
  APPOINTMENT_STATUSES,
  STATUSES,
  fromTiraneInput,
  type FormState,
} from "@/lib/types";

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

  // `.select()` në fund na kthen rreshtat që u prekën vërtet. Pa të, një
  // ndryshim i bllokuar nga rregullat e bazës do të kalonte pa gabim dhe do
  // të dukej sikur u ruajt.
  const { data, error } = await supabase
    .from("clients")
    .update({
      name,
      phone,
      email,
      status,
      // Personalia — fusha opsionale, plotësohen sipas nevojës.
      customer_number: textOrNull(formData.get("customerNumber")),
      gender: textOrNull(formData.get("gender")),
      nationality: textOrNull(formData.get("nationality")),
      birth_date: textOrNull(formData.get("birthDate")),
      street: textOrNull(formData.get("street")),
      postal_code: textOrNull(formData.get("postalCode")),
      canton: textOrNull(formData.get("canton")),
      city: textOrNull(formData.get("city")),
      mobile: textOrNull(formData.get("mobile")),
    })
    .eq("id", clientId)
    .select("id");

  if (error) {
    return { error: `Nuk u ruajtën dot ndryshimet: ${error.message}` };
  }
  if (!data || data.length === 0) {
    return { error: "Ndryshimet nuk u ruajtën: baza nuk e lejoi këtë veprim." };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  return { ok: true, message: "Ndryshimet u ruajtën." };
}

/**
 * Ndryshon tekstin e një shënimi.
 *
 * E bën autori i shënimit, ose administratori për çdo shënim.
 */
export async function updateNote(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const noteId = String(formData.get("noteId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const body = textOrNull(formData.get("body"));

  if (!noteId) {
    return { error: "Mungon shënimi që duhet ndryshuar." };
  }
  if (!body) {
    return { error: "Shënimi nuk mund të jetë bosh." };
  }

  const supabase = await createClient();

  // Kontrolli i lejeve edhe këtu, jo vetëm te rregullat e bazës.
  const { data: note } = await supabase
    .from("notes")
    .select("id, user_id, client_id")
    .eq("id", noteId)
    .maybeSingle<{ id: string; user_id: string; client_id: string }>();

  if (!note) {
    return { error: "Ky shënim nuk u gjet." };
  }
  if (!user.isAdmin && note.user_id !== user.id) {
    return { error: "Këtë shënim e ka shkruar dikush tjetër." };
  }

  const { data, error } = await supabase
    .from("notes")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .select("id");

  if (error) {
    return { error: `Nuk u ruajt dot shënimi: ${error.message}` };
  }
  if (!data || data.length === 0) {
    return { error: "Shënimi nuk u ruajt: baza nuk e lejoi këtë veprim." };
  }

  revalidatePath(`/clients/${clientId || note.client_id}`);
  return { ok: true, message: "Shënimi u ndryshua." };
}

/**
 * Shënon se përdoruesi është aktiv tani.
 *
 * Thirret çdo 2 minuta nga shfletuesi, sa kohë faqja është e hapur. Vetë
 * llogaritjen e bën baza e të dhënave (funksioni `record_activity`), që
 * askush të mos i shkruajë dot numrat e vet.
 */
export async function recordActivity(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase.rpc("record_activity");
}

// =====================================================================
// TAKIMET
// =====================================================================

/** Lexon fushat e përbashkëta të formularit të takimit. */
function readAppointmentFields(formData: FormData) {
  const scheduled = fromTiraneInput(String(formData.get("scheduledAt") ?? ""));
  const persons = Number(formData.get("personsCount") ?? 1);
  const contracts = Number(formData.get("contractsClosed") ?? 0);
  const status = String(formData.get("status") ?? "open");

  return {
    scheduled,
    persons,
    contracts,
    status,
    values: {
      call_center: textOrNull(formData.get("callCenter")),
      current_insurance: textOrNull(formData.get("currentInsurance")),
      call_date: textOrNull(formData.get("callDate")),
      language: textOrNull(formData.get("language")),
      family_details: textOrNull(formData.get("familyDetails")),
      current_treatment: textOrNull(formData.get("currentTreatment")),
      treatment_type: textOrNull(formData.get("treatmentType")),
      medications: textOrNull(formData.get("medications")),
      multi_year_contract: formData.get("multiYearContract") === "on",
      treatment: formData.get("treatment") === "on",
    },
  };
}

/** Kontrollet e përbashkëta. Kthen tekstin e gabimit, ose `null`. */
function validateAppointment(
  scheduled: string | null,
  persons: number,
  contracts: number,
  status: string
): string | null {
  if (!scheduled) return "Data dhe ora e takimit janë të detyrueshme.";
  if (!Number.isInteger(persons) || persons < 1) {
    return "Numri i personave duhet të jetë të paktën 1.";
  }
  if (!Number.isInteger(contracts) || contracts < 0) {
    return "Numri i kontratave nuk është i saktë.";
  }
  if (contracts > persons) {
    return `Nuk mund të ketë ${contracts} kontrata për ${persons} persona.`;
  }
  if (!APPOINTMENT_STATUSES.some((s) => s.value === status)) {
    return "Statusi i zgjedhur nuk njihet.";
  }
  return null;
}

/** Cakton një takim të ri për një klient. */
export async function createAppointment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const clientId = String(formData.get("clientId") ?? "");
  const { scheduled, persons, contracts, status, values } =
    readAppointmentFields(formData);

  if (!clientId) return { error: "Mungon klienti i takimit." };

  const gabim = validateAppointment(scheduled, persons, contracts, status);
  if (gabim) return { error: gabim };

  const supabase = await createClient();
  if (!(await findEditableClient(supabase, clientId, user))) {
    return { error: "Ky klient nuk u gjet ose nuk ke të drejtë mbi të." };
  }

  const { error } = await supabase.from("appointments").insert({
    ...values,
    client_id: clientId,
    user_id: user.id,
    scheduled_at: scheduled,
    persons_count: persons,
    contracts_closed: contracts,
    status,
  });

  if (error) {
    return { error: `Nuk u ruajt dot takimi: ${error.message}` };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/takimet");
  return { ok: true, message: "Takimi u caktua." };
}

/** Ndryshon një takim: të dhënat teknike, rezultatin dhe detajet. */
export async function updateAppointment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = String(formData.get("appointmentId") ?? "");
  const { scheduled, persons, contracts, status, values } =
    readAppointmentFields(formData);

  if (!id) return { error: "Mungon takimi që duhet ndryshuar." };

  const gabim = validateAppointment(scheduled, persons, contracts, status);
  if (gabim) return { error: gabim };

  const supabase = await createClient();

  // Kontrolli i lejeve edhe këtu, jo vetëm te rregullat e bazës.
  const { data: takimi } = await supabase
    .from("appointments")
    .select("id, user_id, client_id")
    .eq("id", id)
    .maybeSingle<{ id: string; user_id: string; client_id: string }>();

  if (!takimi) return { error: "Ky takim nuk u gjet." };
  if (!user.isAdmin && takimi.user_id !== user.id) {
    return { error: "Këtë takim e ka caktuar dikush tjetër." };
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      ...values,
      scheduled_at: scheduled,
      persons_count: persons,
      contracts_closed: contracts,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id");

  if (error) {
    return { error: `Nuk u ruajtën dot ndryshimet: ${error.message}` };
  }
  if (!data || data.length === 0) {
    return { error: "Ndryshimet nuk u ruajtën: baza nuk e lejoi këtë veprim." };
  }

  revalidatePath(`/takimet/${id}`);
  revalidatePath(`/clients/${takimi.client_id}`);
  revalidatePath("/takimet");
  return { ok: true, message: "Takimi u përditësua." };
}
