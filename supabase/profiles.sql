-- Grocery Menu: user profiles (display name, photo, bio, cooking/eating scales,
-- favourite meals). Paste into Supabase → SQL Editor → New query → Run.
-- Safe to re-run.

create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  display_name     text check (char_length(btrim(display_name)) between 1 and 40),
  bio              text check (char_length(bio) <= 280),
  avatar_url       text,
  cook_willingness smallint not null default 5 check (cook_willingness between 0 and 10),
  eat_willingness  smallint not null default 5 check (eat_willingness between 0 and 10),
  favorites        text[] not null default '{}' check (cardinality(favorites) <= 200),
  updated_at       timestamptz not null default now()
);

-- (for anyone who ran an earlier version of this file)
alter table public.profiles add column if not exists favorites text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- Every account gets a profile automatically, so the other party member shows up on
-- your profile page even before they've edited theirs.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- …and a profile for the accounts that already exist (you two).
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- The database stamps updated_at itself instead of trusting the browser.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Access rules: everyone logged in can see every profile (it's a household
-- app); you can only create or change your own. Logged-out visitors get nothing.
alter table public.profiles enable row level security;

drop policy if exists "household can read profiles" on public.profiles;
create policy "household can read profiles" on public.profiles
  for select to authenticated using (true);

drop policy if exists "you can create your profile" on public.profiles;
create policy "you can create your profile" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));

drop policy if exists "you can edit your profile" on public.profiles;
create policy "you can edit your profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select, insert, update on public.profiles to authenticated;
revoke all on public.profiles from anon;

-- Live updates, so the other party member sees profile changes straight away.
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Profile photos. Public bucket so images load straight from their URL
-- (URLs contain the account's random id, so they aren't guessable).
-- Each person can only add/replace/delete files in their own folder (<user id>/…).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars: read" on storage.objects;
create policy "avatars: read" on storage.objects
  for select to authenticated using (bucket_id = 'avatars');

drop policy if exists "avatars: upload own" on storage.objects;
create policy "avatars: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars: update own" on storage.objects;
create policy "avatars: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars: delete own" on storage.objects;
create policy "avatars: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
