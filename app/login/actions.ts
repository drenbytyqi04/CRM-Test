"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

/** Përkthen gabimet e Supabase-it në shqip. */
function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "Email ose fjalëkalim i gabuar.";
  }
  if (m.includes("email not confirmed")) {
    return "Emaili nuk është konfirmuar ende. Kontrollo kutinë postare.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Ky email është i regjistruar. Provo të hysh në vend që të regjistrohesh.";
  }
  if (m.includes("password") && m.includes("6")) {
    return "Fjalëkalimi duhet të ketë të paktën 6 shenja.";
  }
  return message;
}

/**
 * Një funksion i vetëm për të dyja butonat: "Hyr" dhe "Regjistrohu".
 * Cili u shtyp, tregohet nga fusha `intent`.
 */
export async function authenticate(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const intent = String(formData.get("intent") ?? "signin");

  if (!email || !password) {
    return { error: "Plotëso emailin dhe fjalëkalimin." };
  }

  const supabase = await createClient();

  if (intent === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: translateError(error.message) };

    // Nëse projekti kërkon konfirmim me email, sesioni nuk krijohet menjëherë.
    if (!data.session) {
      return {
        ok: true,
        error: undefined,
        message:
          "Llogaria u krijua. Hap emailin, kliko lidhjen e konfirmimit dhe pastaj hyr këtu.",
      };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: translateError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/** Dalje nga llogaria. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
