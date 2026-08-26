-- =====================================================================
-- REDAKTIMI DHE SHËNIMET PËR ADMINISTRATORIN
--
-- Çfarë shton kjo skedë:
--   1. Administratori mund të shtojë shënime te ÇDO klient, edhe te ata që
--      i ka krijuar dikush tjetër.
--   2. Administratori mund të ndryshojë të dhënat e çdo klienti.
--   3. Çdo përdorues mund të ndryshojë klientët e vet.
--   4. Pronari i klientit i sheh të gjitha shënimet e atij klienti — edhe ato
--      që i ka shkruar administratori.
--   5. Shënimin e ndryshon autori i tij; administratori ndryshon çdo shënim.
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
-- 1. Kush i sheh shënimet
-- ---------------------------------------------------------------------
-- Deri tani shënimi shihej nga ai që e shkroi. Kjo nuk mjafton më: nëse
-- administratori shkruan një shënim te klienti yt, ti duhet ta shohësh.
-- Prandaj tani rregulli lidhet me KLIENTIN, jo me autorin e shënimit:
-- "shihen shënimet e klientëve të mi — ose të gjitha, nëse jam admin".
drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_select_own_or_admin" on public.notes;
create policy "notes_select_by_client_or_admin" on public.notes
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.clients c
      where c.id = client_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 2. Kush shton shënime
-- ---------------------------------------------------------------------
-- `user_id = auth.uid()` mbetet: shënimi mban emrin e atij që e shkroi,
-- pra autorësia nuk humbet. Ndryshon vetëm te CILI klient lejohet shkrimi.
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_insert_own_or_admin" on public.notes;
create policy "notes_insert_by_client_or_admin" on public.notes
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

-- ---------------------------------------------------------------------
-- 3. Kush i ndryshon shënimet
-- ---------------------------------------------------------------------
-- Kolona `updated_at` mban gjurmën se kur u prek shënimi për herë të fundit.
-- Shënimin e ndryshon autori i tij; administratori e ndryshon çdo shënim.
alter table public.notes
  add column if not exists updated_at timestamptz;

drop policy if exists "notes_update_author_or_admin" on public.notes;
create policy "notes_update_author_or_admin" on public.notes
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Kush i ndryshon të dhënat e klientit
-- ---------------------------------------------------------------------
-- `using`      = cilët rreshta lejohet t'i prekësh.
-- `with check` = si lejohet të duket rreshti PAS ndryshimit. Kjo e dyta
--                ndalon një përdorues të zakonshëm t'ia kalojë klientin
--                dikujt tjetër.
drop policy if exists "clients_update_own_or_admin" on public.clients;
create policy "clients_update_own_or_admin" on public.clients
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- Shënim: fshirja (delete) NUK lejohet ende për askënd — as për adminin.
-- Kur ta duash, shtohet kështu:
--
--   create policy "clients_delete_own_or_admin" on public.clients
--     for delete to authenticated
--     using (user_id = auth.uid() or public.is_admin());
-- ---------------------------------------------------------------------
