-- Grocery Menu: the RPG class you picked on your character sheet.
-- Run AFTER profiles.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to re-run.
--
-- null = not picked yet (the app shows Vagabond). The class list and each
-- class's stats live in src/lib/rpgStats.js; keep the names below in step.

alter table public.profiles
  add column if not exists rpg_class text;

alter table public.profiles drop constraint if exists profiles_rpg_class_known;
alter table public.profiles
  add constraint profiles_rpg_class_known
  check (rpg_class is null or rpg_class in (
    'Hero', 'Bandit', 'Astrologer', 'Warrior', 'Prisoner',
    'Confessor', 'Wretch', 'Vagabond', 'Prophet', 'Samurai'
  ));

-- Auto-grant is off on this project; profiles.sql grants the table, repeated
-- here so the new column is covered even if that grant was narrowed.
grant select, insert, update on public.profiles to authenticated;
