import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  /** true vetëm për administratorin: sheh të gjithë përdoruesit dhe të dhënat. */
  isAdmin: boolean;
};

/**
 * Kthen përdoruesin e kyçur, ose `null`.
 *
 * `getClaims()` e verifikon vërtetësinë e sesionit — nuk i beson thjesht
 * cookie-t, të cilën mund ta trillojë kushdo.
 * `cache()` bën që edhe nëse thirret disa herë brenda së njëjtës faqe,
 * puna të bëhet vetëm një herë.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) return null;

  const id = String(claims.sub);
  const email = String(claims.email ?? "");

  // Roli lexohet nga tabela `profiles`. Nëse ajo tabelë nuk ekziston ende
  // (SQL-i i `supabase/admin.sql` s'është ekzekutuar), kjo kthen thjesht
  // gabim dhe ne e trajtojmë si përdorues të zakonshëm — aplikacioni
  // vazhdon të punojë normalisht.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle<{ role: string }>();

  return { id, email, isAdmin: profile?.role === "admin" };
});

/** Si më sipër, por dërgon te faqja e hyrjes nëse s'ka njeri të kyçur. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Për faqet vetëm-për-admin: kush s'është admin, s'e sheh se ekzistojnë. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/");
  return user;
}
