import { createClient } from "@supabase/supabase-js";

/**
 * Lidhja me Supabase.
 *
 * Kjo skedë ekzekutohet VETËM në server (Server Components dhe Server Actions),
 * kurrë në shfletuesin e vizitorit. Prandaj këtu përdorim çelësin sekret
 * `service_role`, i cili ka akses të plotë në bazën e të dhënave.
 *
 * Të dy vlerat lexohen nga skeda `.env.local` (shih `.env.local.example`).
 */
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Mungojnë SUPABASE_URL ose SUPABASE_SERVICE_ROLE_KEY. " +
        "Kopjo skedën .env.local.example si .env.local dhe plotëso vlerat nga Supabase."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/** A janë vendosur çelësat në `.env.local`? */
export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
