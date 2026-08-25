-- =====================================================================
-- HAPI I ADMINISTRATORIT
--
-- Kjo skedë shton rolet: një "admin" që sheh të gjithë përdoruesit dhe
-- të gjitha të dhënat, ndërsa përdoruesit e zakonshëm mbeten të kufizuar
-- te të vetat.
--
-- SI PËRDORET (një herë):
--   1. https://supabase.com/dashboard -> projekti "crm-test"
--   2. Menyja e majtë -> "SQL Editor" -> "New query"
--   3. Kopjo GJITHË këtë skedë, ngjite atje, kliko "Run"
--   4. Pastaj ekzekuto rreshtin e fundit (poshtë) me emailin tënd
--
-- Mund ta ekzekutosh disa herë pa dëm.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabela e roleve
-- ---------------------------------------------------------------------
-- Një rresht për çdo llogari. Roli është ose 'user' ose 'admin'.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Llogaritë që ekzistojnë tashmë marrin profilin e tyre tani.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2. Profili krijohet vetvetiu për çdo llogari të re
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. Pyetja "a është admin ai që po kërkon?"
-- ---------------------------------------------------------------------
-- `security definer` do të thotë që funksioni e lexon tabelën me të drejtat
-- e pronarit. Kjo është e nevojshme, përndryshe kontrolli do të hynte në
-- një cikël të pafund me vetë rregullat e sigurisë.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 4. Kush i sheh rolet
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- VINI RE: nuk ka asnjë rregull për ndryshim (update/insert/delete).
-- Prandaj asnjë përdorues nuk mund ta bëjë veten admin. Rolet ndryshohen
-- vetëm nga ti, nga paneli i Supabase-it.

-- ---------------------------------------------------------------------
-- 5. Rregullat e leximit: "të miat — ose të gjitha, nëse jam admin"
-- ---------------------------------------------------------------------
drop policy if exists "clients_select_own" on public.clients;
drop policy if exists "clients_select_own_or_admin" on public.clients;
create policy "clients_select_own_or_admin" on public.clients
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_select_own_or_admin" on public.notes;
create policy "notes_select_own_or_admin" on public.notes
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Shtimi mbetet si ishte: secili shton vetëm në emër të vetvetes,
-- edhe administratori.

-- =====================================================================
-- 6. BËJE VETEN ADMIN
-- =====================================================================
-- Zëvendëso emailin me tëndin dhe ekzekuto këtë rresht:
--
--   update public.profiles set role = 'admin' where email = 'emaili.yt@shembull.com';
--
-- Kontrollo pastaj se u krye:
--
--   select email, role from public.profiles order by role;
--
-- E njëjta gjë mund të bëhet edhe pa SQL:
-- Table Editor -> profiles -> kliko qelizën `role` -> shkruaj `admin`.
