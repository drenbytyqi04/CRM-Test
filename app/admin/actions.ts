"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
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
