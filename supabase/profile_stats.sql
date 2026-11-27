-- Grocery Menu: lifetime activity counters for the RPG-style character sheet.
-- Run AFTER profiles.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to re-run.

alter table public.profiles
  add column if not exists meals_planned integer not null default 0,
  add column if not exists items_added   integer not null default 0,
  add column if not exists items_ticked  integer not null default 0;

-- Bump your own counters (called by the app when you plan a meal, add items
-- or tick things off). Runs with your own permissions, so it can only ever
-- touch your own profile row; each call is capped to keep numbers sane.
create or replace function public.bump_my_stats(
  meals  integer default 0,
  added  integer default 0,
  ticked integer default 0
)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.profiles
     set meals_planned = meals_planned + least(greatest(meals, 0), 50),
         items_added   = items_added   + least(greatest(added, 0), 200),
         items_ticked  = items_ticked  + least(greatest(ticked, 0), 200)
   where id = (select auth.uid());
$$;

revoke all on function public.bump_my_stats(integer, integer, integer) from public, anon;
grant execute on function public.bump_my_stats(integer, integer, integer) to authenticated;
