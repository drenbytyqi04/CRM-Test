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
  return message;
}

/**
 * Hyrja në llogari.
 *
 * Nuk ka regjistrim: llogaritë i hap administratori nga faqja
 * «Përdoruesit». Shih `app/admin/actions.ts`.
 */
export async function authenticate(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Plotëso emailin dhe fjalëkalimin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translateError(error.message) };

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
