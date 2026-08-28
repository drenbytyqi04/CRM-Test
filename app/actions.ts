"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireManager, requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n-server";
import type { Dict } from "@/lib/i18n";
import {
  APPOINTMENT_STATUSES,
  fromBeogradInput,
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


/**
 * I thotë Next.js-it se të dhënat e termineve kanë ndryshuar.
 *
 * `"layout"` te rrënja pastron çdo faqe nën kornizën kryesore: listën dhe
 * të tria adresat e terminit (një për çdo rol). Freskimi vetëm i faqeve të
 * veçanta nuk mjaftonte — pas fshirjes, shfletuesi e nxirrte listën nga
 * memoria e vet dhe termini i fshirë dukej sikur ishte ende aty.
 */
function freskoTerminet(): void {
  revalidatePath("/", "layout");
}

export async function addNote(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const t = await getDict();

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const body = textOrNull(formData.get("body"));

  if (!appointmentId) {
    return { error: t.errNoAppointment };
  }
  if (!body) {
    return { error: t.errEmptyNote };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .insert({ appointment_id: appointmentId, body, user_id: user.id });

  if (error) {
    return { error: `${t.errNoteNotSaved}: ${error.message}` };
  }

  freskoTerminet();
  return { ok: true };
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
  const t = await getDict();

  const noteId = String(formData.get("noteId") ?? "");
  const body = textOrNull(formData.get("body"));

  if (!noteId) {
    return { error: t.errNoteMissing };
  }
  if (!body) {
    return { error: t.errEmptyNote };
  }

  const supabase = await createClient();

  // Kontrolli i lejeve edhe këtu, jo vetëm te rregullat e bazës.
  const { data: note } = await supabase
    .from("notes")
    .select("id, user_id, appointment_id")
    .eq("id", noteId)
    .maybeSingle<{ id: string; user_id: string; appointment_id: string }>();

  if (!note) {
    return { error: t.errNoteNotFound };
  }
  if (!user.isAdmin && note.user_id !== user.id) {
    return { error: t.errNoteNotYours };
  }

  const { data, error } = await supabase
    .from("notes")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .select("id");

  if (error) {
    return { error: `${t.errNoteNotSaved}: ${error.message}` };
  }
  if (!data || data.length === 0) {
    return { error: t.errNoteRejected };
  }

  freskoTerminet();
  return { ok: true, message: t.noteUpdated };
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
// TERMINET
// =====================================================================

/** Lexon fushat e përbashkëta të formularit të terminit. */
function readAppointmentFields(formData: FormData) {
  const scheduled = fromBeogradInput(String(formData.get("scheduledAt") ?? ""));
  const persons = Number(formData.get("personsCount") ?? 1);
  const contracts = Number(formData.get("contractsClosed") ?? 0);
  const status = String(formData.get("status") ?? "open");

  return {
    scheduled,
    persons,
    contracts,
    status,
    values: {
      // Personalia e personit që takohet
      name: textOrNull(formData.get("name")),
      customer_number: textOrNull(formData.get("customerNumber")),
      gender: textOrNull(formData.get("gender")),
      nationality: textOrNull(formData.get("nationality")),
      birth_date: textOrNull(formData.get("birthDate")),
      street: textOrNull(formData.get("street")),
      postal_code: textOrNull(formData.get("postalCode")),
      city: textOrNull(formData.get("city")),
      canton: textOrNull(formData.get("canton")),
      phone: textOrNull(formData.get("phone")),
      mobile: textOrNull(formData.get("mobile")),
      email: textOrNull(formData.get("email")),
      // Të dhëna teknike
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
  status: string,
  name: string | null,
  email: string | null,
  t: Dict
): string | null {
  if (!name) return t.errNameRequired;
  if (email && !looksLikeEmail(email)) return t.errBadEmail;
  if (!scheduled) return t.errDateRequired;
  if (!Number.isInteger(persons) || persons < 1) return t.errPersonsMin;
  if (!Number.isInteger(contracts) || contracts < 0) return t.errContractsBad;
  if (contracts > persons) return t.errContractsTooMany(contracts, persons);
  if (!APPOINTMENT_STATUSES.some((s) => s.value === status)) {
    return t.errUnknownStatus;
  }
  return null;
}

/** Cakton një termin të ri. */
export async function createAppointment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireManager();
  const t = await getDict();
  const { scheduled, persons, contracts, status, values } =
    readAppointmentFields(formData);

  const gabim = validateAppointment(
    scheduled,
    persons,
    contracts,
    status,
    values.name,
    values.email,
    t
  );
  if (gabim) return { error: gabim };

  const supabase = await createClient();
  const { error } = await supabase.from("appointments").insert({
    ...values,
    user_id: user.id,
    scheduled_at: scheduled,
    persons_count: persons,
    contracts_closed: contracts,
    status,
  });

  if (error) {
    return { error: `${t.errAppointmentNotSaved}: ${error.message}` };
  }

  freskoTerminet();
  return { ok: true, message: t.appointmentCreated };
}

/** Ndryshon një termin: të dhënat teknike, rezultatin dhe detajet. */
export async function updateAppointment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireManager();
  const t = await getDict();
  const id = String(formData.get("appointmentId") ?? "");
  const { scheduled, persons, contracts, status, values } =
    readAppointmentFields(formData);

  if (!id) return { error: t.errAppointmentMissing };

  const gabim = validateAppointment(
    scheduled,
    persons,
    contracts,
    status,
    values.name,
    values.email,
    t
  );
  if (gabim) return { error: gabim };

  const supabase = await createClient();

  // Kontrolli i lejeve edhe këtu, jo vetëm te rregullat e bazës.
  const { data: termini } = await supabase
    .from("appointments")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle<{ id: string; user_id: string }>();

  if (!termini) return { error: t.errAppointmentNotFound };

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
    return { error: `${t.errAppointmentNotSaved}: ${error.message}` };
  }
  if (!data || data.length === 0) {
    return { error: t.errChangesRejected };
  }

  freskoTerminet();
  return { ok: true, message: t.appointmentUpdated };
}

/**
 * Fshin një termin. E bën menaxheri ose admini.
 *
 * KUJDES: shënimet e atij termini fshihen bashkë me të — kështu e kërkon
 * lidhja `on delete cascade` te baza. Prandaj butoni te faqja e thotë
 * hapur se sa shënime humbin, dhe kërkon një konfirmim të dytë.
 *
 * Nuk kthehet mbrapsht.
 */
export async function deleteAppointment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireManager();
  const t = await getDict();

  const id = String(formData.get("appointmentId") ?? "");
  if (!id) return { error: t.errDeleteMissing };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return { error: `${t.errDeleteFailed}: ${error.message}` };
  }
  // Pa `select` + kontroll, një fshirje që rregullat e bazës nuk e lejojnë
  // do të dukej sikur u krye.
  if (!data || data.length === 0) {
    return { error: t.errDeleteRejected };
  }

  freskoTerminet();
  redirect("/");
}
