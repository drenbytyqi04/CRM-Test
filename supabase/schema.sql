-- =====================================================================
-- Skema e bazës së të dhënave për CRM-in.
--
-- STATUSI: kjo skemë është ZBATUAR TASHMË në projektin "crm-test"
-- (https://zfdavzndfhsjckvifxur.supabase.co). Tabelat janë gati.
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
  -- id = numri unik i klientit, gjenerohet vetë.
  id uuid primary key default gen_random_uuid(),

  -- user_id = kujt përdoruesi i përket ky klient.
  -- `auth.uid()` = përdoruesi i kyçur; mbushet vetvetiu.
  -- `on delete cascade` = nëse fshihet llogaria, fshihen edhe të dhënat e saj.
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  -- emri është i detyrueshëm ("not null" = nuk lejohet bosh).
  name text not null,

  -- telefoni dhe emaili janë opsionalë.
  phone text,
  email text,

  -- statusi lejon vetëm një nga tri vlerat e mëposhtme.
  status text not null default 'lead'
    check (status in ('lead', 'active', 'inactive')),

  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Tabela 2: shënimet
-- ---------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  -- client_id tregon se kujt klienti i përket ky shënim.
  -- nëse fshihet klienti, fshihen edhe shënimet e tij.
  client_id uuid not null references public.clients (id) on delete cascade,

  body text not null,
  created_at timestamptz not null default now()
);

-- Indekset e bëjnë kërkimin të shpejtë kur tabelat rriten.
create index if not exists clients_user_id_created_at_idx
  on public.clients (user_id, created_at desc);

create index if not exists notes_client_id_created_at_idx
  on public.notes (client_id, created_at desc);

create index if not exists notes_user_id_idx
  on public.notes (user_id);

-- ---------------------------------------------------------------------
-- Siguria (RLS = Row Level Security)
-- ---------------------------------------------------------------------
-- RLS është si një roje te dera e tabelës: kontrollon çdo rresht veç e veç.
-- Rregullat e mëposhtme thonë: një përdorues i kyçur sheh dhe shton VETËM
-- rreshtat ku `user_id` është i tiji. Askush nuk i sheh të dhënat e tjetrit,
-- edhe sikur të provojë ta thërrasë bazën drejtpërdrejt.
alter table public.clients enable row level security;
alter table public.notes   enable row level security;

drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own" on public.clients
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own" on public.clients
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.clients c
      where c.id = client_id and c.user_id = auth.uid()
    )
  );

-- Shënim: ka vetëm rregulla për lexim (select) dhe shtim (insert), sepse
-- aplikacioni bën vetëm këto. Kur të shtosh ndryshim ose fshirje, shto edhe:
--
--   create policy "clients_update_own" on public.clients
--     for update to authenticated
--     using (user_id = auth.uid()) with check (user_id = auth.uid());
--
--   create policy "clients_delete_own" on public.clients
--     for delete to authenticated using (user_id = auth.uid());
