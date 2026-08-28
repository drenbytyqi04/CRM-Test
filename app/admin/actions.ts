"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";
import { getDict } from "@/lib/i18n-server";

/** Rolet që mund të jepen nga aplikacioni. */
const ROLET_E_LEJUARA = ["user", "manager"] as const;

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Hap një llogari të re. E bën VETËM administratori.
 *
 * Regjistrimi i lirë është hequr nga faqja e hyrjes: llogaritë i hap ai që
 * drejton ekipin, jo kushdo që gjen adresën.
 *
 * Roli `admin` nuk jepet nga këtu me qëllim. Një admin i dytë është vendim
 * që duhet marrë me dorë, nga paneli i Supabase-it — kështu një llogari
 * admin e vjedhur nuk mund të krijojë vetë të tjera si vetja.
 */
export async function createUserAccount(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const t = await getDict();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user");

  if (!email || !password) {
    return { error: t.errFillBoth };
  }
  if (!looksLikeEmail(email)) {
    return { error: t.errBadEmail };
  }
  if (password.length < 8) {
    return { error: t.errPasswordShort };
  }
  if (!ROLET_E_LEJUARA.includes(role as (typeof ROLET_E_LEJUARA)[number])) {
    return { error: t.errUnknownRole };
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lidhja s'u hap dot." };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    // Emaili shënohet i konfirmuar: llogarinë e hapi admini, jo një i panjohur,
    // prandaj njeriu hyn menjëherë pa pritur asnjë lidhje në email.
    email_confirm: true,
  });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("already") && m.includes("registered")) {
      return { error: t.errEmailExists };
    }
    return { error: `${t.errAccountNotCreated}: ${error.message}` };
  }
  if (!data.user) {
    return { error: t.errAccountNotCreated };
  }

  // Profilin e krijon vetvetiu trigger-i `handle_new_user()`, me rolin
  // `user`. Këtu vendoset roli i zgjedhur. `upsert` e mbulon edhe rastin
  // kur trigger-i s'do të kishte punuar.
  const { error: gabimRoli } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id, email, role }, { onConflict: "id" });

  if (gabimRoli) {
    return { error: t.errRoleNotSet(gabimRoli.message) };
  }

  revalidatePath("/admin");
  return {
    ok: true,
    message: t.okAccountCreated(
      email,
      role === "manager" ? t.roleManager : t.roleUser
    ),
  };
}


/**
 * Heq hyrjen e një llogarie. VETËM administratori.
 *
 * Fshihet llogaria te `auth.users` — pra personi nuk hyn dot më. Por
 * profili i tij mbetet, dhe bashkë me të çdo termin që ka caktuar, çdo
 * shënim që ka shkruar dhe orët e tij të punës. Ato vazhdojnë të mbajnë
 * emrin e tij, jo timin.
 *
 * Kjo ndodh sepse `llogari-pa-humbje.sql` i ktheu lidhjet nga `auth.users`
 * te `profiles`, e cila nuk fshihet kurrë.
 *
 * Tre gjëra ndalohen, sepse secila të lë jashtë sistemit:
 *   1. Të heqësh veten.
 *   2. Të heqësh adminin e fundit.
 *   3. Ta bësh pa qenë admin (kontrollohet që në rreshtin e parë).
 */
export async function deleteUserAccount(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireAdmin();
  const t = await getDict();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: t.errAccountMissing };
  if (userId === admin.id) {
    return { error: t.errCannotRemoveSelf };
  }

  const supabase = await createClient();

  const { data: profili } = await supabase
    .from("profiles")
    .select("id, email, role, active")
    .eq("id", userId)
    .maybeSingle<{
      id: string;
      email: string | null;
      role: string;
      active: boolean;
    }>();

  if (!profili) return { error: t.errAccountNotFound };
  if (!profili.active) return { error: t.errAlreadyNoAccess };

  // Vetëm adminët që ende hyjnë numërohen: një admin pa hyrje nuk e shpëton
  // dot sistemin nëse mbetet i vetmi.
  if (profili.role === "admin") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("active", true);

    if ((count ?? 0) <= 1) {
      return { error: t.errLastAdmin };
    }
  }

  let sherbimi;
  try {
    sherbimi = createAdminClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lidhja s'u hap dot." };
  }

  const { error } = await sherbimi.auth.admin.deleteUser(userId);
  if (error) {
    return { error: `${t.errAccessNotRemoved}: ${error.message}` };
  }

  // Profili mbetet, i shënuar si pa hyrje, që të dhënat e tij të ruajnë
  // emrin e autorit.
  const { error: gabimP } = await sherbimi
    .from("profiles")
    .update({ active: false })
    .eq("id", userId);

  if (gabimP) {
    return { error: t.errProfileNotMarked(gabimP.message) };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: t.okAccessRemoved(profili.email ?? "") };
}
