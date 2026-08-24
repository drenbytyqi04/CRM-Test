/** Shfaqet kur `.env.local` nuk është plotësuar ende. */
export default function SetupNotice() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
      <h2 className="text-base font-semibold text-amber-900">
        Lidhja me Supabase nuk është konfiguruar ende
      </h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-amber-900">
        <li>
          Krijo një projekt falas në{" "}
          <a className="underline" href="https://supabase.com/dashboard">
            supabase.com/dashboard
          </a>
          .
        </li>
        <li>
          Në Supabase hap <b>SQL Editor</b>, ngjit përmbajtjen e skedës{" "}
          <code className="rounded bg-amber-100 px-1">supabase/schema.sql</code> dhe
          kliko <b>Run</b>.
        </li>
        <li>
          Në <b>Settings → API</b> kopjo <b>Project URL</b> dhe çelësin sekret{" "}
          <b>service_role</b>.
        </li>
        <li>
          Në dosjen e projektit kopjo{" "}
          <code className="rounded bg-amber-100 px-1">.env.local.example</code> si{" "}
          <code className="rounded bg-amber-100 px-1">.env.local</code> dhe vendos
          aty të dyja vlerat.
        </li>
        <li>
          Ndale serverin (Ctrl+C) dhe nise sërish me{" "}
          <code className="rounded bg-amber-100 px-1">npm run dev</code>.
        </li>
      </ol>
    </div>
  );
}
