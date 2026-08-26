-- =====================================================================
-- TRI ROLET: user, manager, admin
--
-- Kush çfarë mundet:
--
--   | Veprimi                     | user | manager | admin |
--   |-----------------------------|------|---------|-------|
--   | Lexon takimet e regjistruara|  po  |   po    |  po   |
--   | Shkruan shënime             |  po  |   po    |  po   |
--   | Cakton/ndryshon takime      |  JO  |   po    |  po   |
--   | Përdoruesit dhe aktiviteti  |  JO  |   JO    |  po   |
--   | Ndryshon rolet              |  JO  |   JO    |  JO*  |
--
--   * Rolet ndryshohen vetëm nga paneli i Supabase-it, jo nga aplikacioni.
--
-- VINI RE: leximi është i përbashkët — çdo i kyçur i sheh të gjitha takimet
-- e regjistruara. Shkrimi mbetet i mbyllur: takimet i prek vetëm menaxheri.
--
-- STATUSI: kjo skedë është ZBATUAR TASHMË në projektin "crm-test".
--
-- SI PËRDORET (për një projekt të ri):
--   Supabase -> SQL Editor -> New query -> ngjit -> Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Roli i ri
-- ---------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'manager', 'admin'));

-- Menaxheri dhe admini kanë të njëjtat të drejta mbi klientët e takimet.
create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('manager', 'admin')
  );
$$;

revoke execute on function public.is_manager() from anon, public;
grant  execute on function public.is_manager() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Shënimet — i shkruan kushdo, në emrin e vet
-- ---------------------------------------------------------------------
drop policy if exists "notes_select_by_client_or_admin" on public.notes;
drop policy if exists "notes_select_all" on public.notes;
create policy "notes_select_all" on public.notes
  for select to authenticated
  using (true);

drop policy if exists "notes_insert_any_appointment" on public.notes;
create policy "notes_insert_any_appointment" on public.notes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.appointments a where a.id = appointment_id)
  );

-- Ndryshimi i shënimit mbetet i autorit, ose i adminit.
drop policy if exists "notes_update_author_or_admin" on public.notes;
create policy "notes_update_author_or_admin" on public.notes
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 3. Takimet
-- ---------------------------------------------------------------------
drop policy if exists "appointments_select_own_or_admin" on public.appointments;
drop policy if exists "appointments_select_all" on public.appointments;
create policy "appointments_select_all" on public.appointments
  for select to authenticated
  using (true);

drop policy if exists "appointments_insert_manager" on public.appointments;
create policy "appointments_insert_manager" on public.appointments
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_manager());

drop policy if exists "appointments_update_own_or_admin" on public.appointments;
drop policy if exists "appointments_update_manager" on public.appointments;
create policy "appointments_update_manager" on public.appointments
  for update to authenticated
  using (public.is_manager())
  with check (public.is_manager());

-- =====================================================================
-- Si i cakton rolet
-- =====================================================================
--   update public.profiles set role = 'manager' where email = 'dikush@shembull.com';
--   update public.profiles set role = 'user'    where email = 'dikush@shembull.com';
--
-- Ose pa SQL: Table Editor -> profiles -> kliko qelizën `role`.
