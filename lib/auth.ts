import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Rolet e mundshme. Duhet të përputhen me `supabase/roles.sql`. */
export type Role = "user" | "manager" | "admin" | "expert";

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
  /** Admini: gjithçka, plus përdoruesit dhe aktiviteti. */
  isAdmin: boolean;
  /**
   * Menaxheri ose admini: shtojnë e ndryshojnë klientë dhe termine.
   * Përdoruesi i thjeshtë vetëm i lexon ato dhe shkruan shënime.
   */
  isManager: boolean;
  /**
   * Eksperti: sheh VETËM terminet që ia jep admini, dhe mbi to lexon e
   * shkruan shënime. Kufiri i vërtetë rri te baza (`supabase/eksperti.sql`);
   * kjo shenjë shërben vetëm që faqja të mos i tregojë butona që s'i hapen.
   */
  isExpert: boolean;
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

  const role: Role =
    profile?.role === "admin"
      ? "admin"
      : profile?.role === "manager"
        ? "manager"
        : profile?.role === "expert"
          ? "expert"
          : "user";

  return {
    id,
    email,
    role,
    isAdmin: role === "admin",
    isManager: role === "admin" || role === "manager",
    isExpert: role === "expert",
  };
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

/** Për veprimet që i lejohen vetëm menaxherit dhe adminit. */
export async function requireManager(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.isManager) redirect("/");
  return user;
}
