import LoginForm from "./login-form";
import SetupNotice from "../setup-notice";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { lang } = await getI18n();

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      {hasSupabaseConfig() ? <LoginForm lang={lang} /> : <SetupNotice />}
    </main>
  );
}
