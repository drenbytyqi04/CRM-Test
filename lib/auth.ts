import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string };

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
  return { id: String(claims.sub), email: String(claims.email ?? "") };
});

/** Si më sipër, por dërgon te faqja e hyrjes nëse s'ka njeri të kyçur. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
