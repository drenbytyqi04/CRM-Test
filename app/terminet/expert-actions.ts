"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n-server";
import type { FormState } from "@/lib/types";

/**
 * Kush e sheh cilin termin.
 *
 * Aksesin e jep dhe e heq VETËM administratori. Kontrolli bëhet në tri
 * shtresa, dhe secila mjafton më vete:
 *
 *   1. Faqja nuk e vizaton fare panelin për të tjerët.
 *   2. Këto funksione e kontrollojnë rolin vetë — mund të thirren edhe pa
 *      kaluar nga faqja jonë.
 *   3. Rregullat e bazës (`supabase/eksperti.sql`) e kërkojnë `is_admin()`.
 *
 * E treta është ajo që mban vërtet. Dy të parat janë që përdoruesi të marrë
 * një mesazh të kuptueshëm në vend të një gabimi teknik.
 */

/** Freskon listën dhe të tria adresat e terminit. */
function fresko(): void {
  revalidatePath("/", "layout");
}

export async function grantExpert(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const t = await getDict();

  if (!user.isAdmin) return { error: t.errExpertsAdminOnly };

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const expertId = String(formData.get("expertId") ?? "");
  if (!appointmentId) return { error: t.errNoAppointment };
  if (!expertId) return { error: t.errExpertMissing };

  const supabase = await createClient();

  // Vetëm një llogari me rolin `expert` mund të marrë akses. Pa këtë,
  // admini do të mund t'i jepte "akses" një menaxheri — gjë që s'do të
  // ndryshonte gjë, por do të linte rreshta që nuk thonë asgjë.
  const { data: profili } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", expertId)
    .maybeSingle<{ id: string; email: string | null; role: string }>();

  if (!profili) return { error: t.errExpertMissing };
  if (profili.role !== "expert") return { error: t.errExpertNotExpert };

  const { error } = await supabase
    .from("appointment_experts")
    .insert({
      appointment_id: appointmentId,
      expert_id: expertId,
      granted_by: user.id,
    });

  if (error) {
    // Çelësi kryesor (termin + ekspert) e ndalon dyfishimin. Kjo nuk është
    // gabim i vërtetë: personi thjesht e kishte tashmë aksesin.
    if (error.code === "23505") return { error: t.errExpertAlready };
    return { error: `${t.errExpertFailed}: ${error.message}` };
  }

  fresko();
  return { ok: true, message: t.expertsGranted(profili.email ?? "") };
}

export async function revokeExpert(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const t = await getDict();

  if (!user.isAdmin) return { error: t.errExpertsAdminOnly };

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const expertId = String(formData.get("expertId") ?? "");
  const email = String(formData.get("email") ?? "");
  if (!appointmentId || !expertId) return { error: t.errExpertMissing };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointment_experts")
    .delete()
    .eq("appointment_id", appointmentId)
    .eq("expert_id", expertId)
    .select("expert_id");

  if (error) return { error: `${t.errExpertFailed}: ${error.message}` };
  // Pa `select` + kontroll, një fshirje që rregullat e bazës nuk e lejojnë
  // do të dukej sikur u krye.
  if (!data || data.length === 0) return { error: t.errExpertsAdminOnly };

  fresko();
  return { ok: true, message: t.expertsRevoked(email) };
}
