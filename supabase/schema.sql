-- =====================================================================
-- Skema e bazës së të dhënave për CRM-in.
--
-- STATUSI: kjo skemë është ZBATUAR TASHMË në projektin "crm-test"
-- (https://zfdavzndfhsjckvifxur.supabase.co). Tabelat janë gati për përdorim.
-- Skeda ruhet këtu si dëshmi e strukturës dhe të duhet vetëm nëse një ditë
-- krijon një projekt tjetër Supabase.
--
-- Si përdoret (për një projekt të ri):
--   1. Hyr në https://supabase.com/dashboard dhe zgjidh projektin tënd.
--   2. Në menynë e majtë kliko "SQL Editor" -> "New query".
--   3. Kopjo GJITHË këtë skedë, ngjite atje dhe kliko "Run".
--
-- Mund ta ekzekutosh disa herë pa problem: përdor "if not exists".
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabela 1: klientët
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  -- id = numri unik i klientit, gjenerohet vetë (p.sh. "9f1c...-...").
  id uuid primary key default gen_random_uuid(),

  -- emri është i detyrueshëm ("not null" = nuk lejohet bosh).
  name text not null,

  -- telefoni dhe emaili janë opsionalë, prandaj lejojnë vlerë boshe (null).
  phone text,
  email text,

  -- statusi lejon vetëm një nga tri vlerat e mëposhtme.
  status text not null default 'lead'
    check (status in ('lead', 'active', 'inactive')),

  -- data e krijimit vendoset automatikisht nga baza e të dhënave.
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Tabela 2: shënimet
-- ---------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),

  -- client_id tregon se kujt klienti i përket ky shënim.
  -- "references public.clients(id)" = duhet të ekzistojë një klient me këtë id.
  -- "on delete cascade" = nëse fshihet klienti, fshihen edhe shënimet e tij.
  client_id uuid not null references public.clients(id) on delete cascade,

  body text not null,
  created_at timestamptz not null default now()
);

-- Indekset e bëjnë kërkimin të shpejtë kur tabela rritet.
create index if not exists notes_client_id_created_at_idx
  on public.notes (client_id, created_at desc);

create index if not exists clients_created_at_idx
  on public.clients (created_at desc);

-- ---------------------------------------------------------------------
-- Siguria (RLS = Row Level Security)
-- ---------------------------------------------------------------------
-- E ndezim RLS-në dhe NUK shkruajmë asnjë rregull (policy).
-- Rezultati: askush nga jashtë nuk i lexon dot këto tabela me çelësin
-- publik `anon`. Aplikacioni ynë i lexon sepse në server përdor çelësin
-- sekret `service_role`, i cili e anashkalon RLS-në.
--
-- Kur të shtosh autentikim më vonë, do të kalosh te çelësi `anon` dhe do
-- të shtosh rregulla si ky (tani i lëmë të komentuara):
--
--   create policy "secili sheh klientët e vet"
--     on public.clients for select
--     using (auth.uid() = user_id);
--
alter table public.clients enable row level security;
alter table public.notes   enable row level security;
