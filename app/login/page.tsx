import LoginForm from "./login-form";
import SetupNotice from "../setup-notice";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      {hasSupabaseConfig() ? <LoginForm /> : <SetupNotice />}
    </main>
  );
}
