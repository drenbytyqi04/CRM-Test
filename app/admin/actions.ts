"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

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

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user");

  if (!email || !password) {
    return { error: "Plotëso emailin dhe fjalëkalimin." };
  }
  if (!looksLikeEmail(email)) {
    return { error: "Emaili nuk duket i saktë (shembull: emri@shembull.com)." };
  }
  if (password.length < 8) {
    return { error: "Fjalëkalimi duhet të ketë të paktën 8 shenja." };
  }
  if (!ROLET_E_LEJUARA.includes(role as (typeof ROLET_E_LEJUARA)[number])) {
    return { error: "Roli i zgjedhur nuk njihet." };
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
      return { error: "Ky email ka tashmë një llogari." };
    }
    return { error: `Llogaria nuk u hap: ${error.message}` };
  }
  if (!data.user) {
    return { error: "Llogaria nuk u hap: baza nuk ktheu asnjë llogari." };
  }

  // Profilin e krijon vetvetiu trigger-i `handle_new_user()`, me rolin
  // `user`. Këtu vendoset roli i zgjedhur. `upsert` e mbulon edhe rastin
  // kur trigger-i s'do të kishte punuar.
  const { error: gabimRoli } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id, email, role }, { onConflict: "id" });

  if (gabimRoli) {
    return {
      error:
        `Llogaria u hap, por roli nuk u vendos: ${gabimRoli.message}. ` +
        "Ndryshoje rolin te tabela `profiles`.",
    };
  }

  revalidatePath("/admin");
  return {
    ok: true,
    message: `Llogaria ${email} u hap si ${
      role === "manager" ? "menaxher" : "përdorues"
    }. Jepi fjalëkalimin dhe le ta ndryshojë vetë më pas.`,
  };
}


/**
 * Fshin një llogari. VETËM administratori.
 *
 * Fshirja merr me vete gjithçka të asaj llogarie — terminet, shënimet dhe
 * aktivitetin — sepse te `schema.sql` lidhjet janë `on delete cascade`.
 * Prandaj faqja i numëron ato para se të pyesë, dhe ofron edhe mundësinë
 * t'i kalosh te vetja në vend që t'i humbasësh.
 *
 * Tre gjëra ndalohen me qëllim, sepse secila të lë jashtë sistemit:
 *   1. Të fshish veten.
 *   2. Të fshish adminin e fundit.
 *   3. Të fshish dikë kur nuk je admin (kontrollohet që në rreshtin e parë).
 */
export async function deleteUserAccount(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const kaloTeUne = formData.get("kaloTeUne") === "1";

  if (!userId) return { error: "Mungon llogaria që duhet fshirë." };
  if (userId === admin.id) {
    return { error: "Nuk e fshin dot llogarinë tënde." };
  }

  const supabase = await createClient();

  const { data: profili } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .maybeSingle<{ id: string; email: string | null; role: string }>();

  if (!profili) return { error: "Kjo llogari nuk u gjet." };

  // Sistemi pa asnjë admin nuk hapet më nga aplikacioni — roli ndryshohet
  // vetëm nga paneli i Supabase-it.
  if (profili.role === "admin") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      return { error: "Ky është admini i fundit — nuk fshihet dot." };
    }
  }

  let sherbimi;
  try {
    sherbimi = createAdminClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lidhja s'u hap dot." };
  }

  // Nëse kërkohet, të dhënat kalojnë te admini para fshirjes; përndryshe
  // ato ikin bashkë me llogarinë.
  if (kaloTeUne) {
    const { error: gabimT } = await sherbimi
      .from("appointments")
      .update({ user_id: admin.id })
      .eq("user_id", userId);
    const { error: gabimSh } = await sherbimi
      .from("notes")
      .update({ user_id: admin.id })
      .eq("user_id", userId);

    if (gabimT || gabimSh) {
      return {
        error:
          "Të dhënat nuk u kaluan dot, prandaj llogaria NUK u fshi: " +
          (gabimT?.message ?? gabimSh?.message),
      };
    }
  }

  const { error } = await sherbimi.auth.admin.deleteUser(userId);
  if (error) {
    return { error: `Llogaria nuk u fshi: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `Llogaria ${profili.email ?? ""} u fshi.${
      kaloTeUne ? " Të dhënat e saj kaluan te ti." : ""
    }`,
  };
}
