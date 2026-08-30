import Image from "next/image";
import LoginForm from "./login-form";
import SetupNotice from "../setup-notice";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { lang } = await getI18n();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-5 py-10">
      {/* Logoja e plotë rri vetëm këtu: faqja e hyrjes është e vetmja që s'ka
          menynë anash, dhe e vetmja që e sheh dikush para se të njohë faqen. */}
      <Image
        src="/logo.png"
        alt="Assurance ACC"
        width={720}
        height={492}
        priority
        className="h-28 w-auto"
      />
      {hasSupabaseConfig() ? <LoginForm lang={lang} /> : <SetupNotice />}
    </main>
  );
}
