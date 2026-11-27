-- Grocery Menu: where you've spent your level-up stat points.
-- Run AFTER profiles.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to re-run.
--
-- Stored as e.g. {"strength": 4, "magic": 2}. The app works out how many
-- points you've earned (5 + 3 per level) and won't let you overspend.

alter table public.profiles
  add column if not exists stat_points jsonb not null default '{}'::jsonb;

alter table public.profiles drop constraint if exists profiles_stat_points_is_object;
alter table public.profiles
  add constraint profiles_stat_points_is_object
  check (jsonb_typeof(stat_points) = 'object');
