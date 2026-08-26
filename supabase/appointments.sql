-- =====================================================================
-- TAKIMET (Termin)
--
-- Shton:
--   1. Fusha të reja te klientët: numër klienti, gjini, kombësi, datëlindje,
--      adresë, kod postar, kanton, qytet, celular.
--   2. Tabelën `appointments` — një takim i caktuar për një klient, me të
--      dhënat teknike, rezultatin dhe detajet e këshillimit.
--
-- STATUSI: kjo skedë është ZBATUAR TASHMË në projektin "crm-test".
-- Ruhet këtu si dëshmi e strukturës; do të të duhej për një projekt tjetër.
--
-- SI PËRDORET (për një projekt të ri):
--   1. https://supabase.com/dashboard -> projekti yt
--   2. Menyja e majtë -> "SQL Editor" -> "New query"
--   3. Kopjo GJITHË këtë skedë, ngjite atje, kliko "Run"
--
-- Mund ta ekzekutosh disa herë pa dëm.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Fushat e reja te klientët
-- ---------------------------------------------------------------------
alter table public.clients add column if not exists customer_number text;
alter table public.clients add column if not exists gender text;
alter table public.clients add column if not exists nationality text;
alter table public.clients add column if not exists birth_date date;
alter table public.clients add column if not exists street text;
alter table public.clients add column if not exists postal_code text;
alter table public.clients add column if not exists canton text;
alter table public.clients add column if not exists city text;
alter table public.clients add column if not exists mobile text;

-- ---------------------------------------------------------------------
-- 2. Tabela e takimeve
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),

  -- Kush e caktoi takimin (agjenti).
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  -- Cilit klient i përket. Çdo takim lidhet me një klient — nëse është
  -- telefonatë e ftohtë, krijohet fillimisht klienti (mjafton emri).
  client_id uuid not null references public.clients (id) on delete cascade,

  -- --- Të dhëna teknike ---
  call_center text,
  current_insurance text,
  call_date date,
  scheduled_at timestamptz not null,
  language text,
  persons_count integer not null default 1 check (persons_count > 0),

  -- --- Rezultati ---
  -- NJË status i vetëm, jo disa kuti të pavarura: kështu raportet nuk dalin
  -- kurrë kontradiktore (p.sh. "u mbajt" dhe "i anuluar" njëkohësisht).
  status text not null default 'open' check (status in (
    'open',              -- i hapur, ende s'ka ndodhur
    'held',              -- u mbajt
    'cancelled',         -- i anuluar
    'not_reached',       -- klienti nuk u arrit
    'refused',           -- nuk deshi takim
    'negative',          -- negativ
    'not_home',          -- nuk ishte në shtëpi
    'address_not_found', -- adresa nuk u gjet
    'advisor_failed'     -- këshilltari nuk këshilloi dot
  )),

  -- Shenja të pavarura, që mund të shoqërojnë çdo status.
  multi_year_contract boolean not null default false,
  treatment boolean not null default false,

  -- Sa kontrata u mbyllën. Nuk lejohet më shumë se numri i personave —
  -- kjo e ndalon gabimin që numri të fryhet.
  contracts_closed integer not null default 0
    check (contracts_closed >= 0 and contracts_closed <= persons_count),

  -- --- Detaje të këshillimit ---
  family_details text,
  current_treatment text,
  treatment_type text,
  medications text,

  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists appointments_user_scheduled_idx
  on public.appointments (user_id, scheduled_at desc);

create index if not exists appointments_client_idx
  on public.appointments (client_id, scheduled_at desc);

-- ---------------------------------------------------------------------
-- 3. Siguria
-- ---------------------------------------------------------------------
-- Njësoj si te klientët: secili sheh e prek të vetat; administratori të gjitha.
alter table public.appointments enable row level security;

drop policy if exists "appointments_select_own_or_admin" on public.appointments;
create policy "appointments_select_own_or_admin" on public.appointments
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "appointments_insert_own_or_admin" on public.appointments;
create policy "appointments_insert_own_or_admin" on public.appointments
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.clients c
        where c.id = client_id and c.user_id = auth.uid()
      )
    )
  );

drop policy if exists "appointments_update_own_or_admin" on public.appointments;
create policy "appointments_update_own_or_admin" on public.appointments
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- SHËNIM PËR TË DHËNAT SHËNDETËSORE
-- ---------------------------------------------------------------------
-- Fushat `current_treatment`, `treatment_type` dhe `medications` janë të
-- dhëna shëndetësore — kategori e ndjeshme sipas ligjeve të mbrojtjes së
-- të dhënave. Mbaji vetëm nëse të duhen vërtet për këshillimin, informo
-- klientin, dhe mos i mbaj përgjithmonë. Nëse një ditë duhen kontrolle më
-- të forta, ato fusha kalohen në një tabelë të veçantë me rregulla vetëm
-- për ata që u duhen.
