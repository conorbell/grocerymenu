-- Grocery Menu: shared meal plan + grocery list.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to re-run: it only creates things that don't exist yet.

-- Meals you've picked (from the menu or the Create meal form).
create table if not exists public.planned_meals (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  created_at timestamptz not null default now(),
  added_by   uuid references auth.users (id) default auth.uid()
);

-- Everything to buy. planned_meal_id is set when the item came from a meal
-- (and is removed with that meal); it is NULL for standalone items like
-- "paper towels".
create table if not exists public.grocery_items (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  quantity        numeric not null default 1 check (quantity > 0),
  unit            text not null default '',
  checked         boolean not null default false,
  planned_meal_id uuid references public.planned_meals (id) on delete cascade,
  created_at      timestamptz not null default now(),
  added_by        uuid references auth.users (id) default auth.uid()
);

create index if not exists grocery_items_planned_meal_idx
  on public.grocery_items (planned_meal_id);

-- One shared household list: anyone who is logged in can read and edit
-- everything; logged-out visitors can't see or change anything.
alter table public.planned_meals enable row level security;
alter table public.grocery_items enable row level security;

drop policy if exists "household can do everything" on public.planned_meals;
create policy "household can do everything" on public.planned_meals
  for all to authenticated using (true) with check (true);

drop policy if exists "household can do everything" on public.grocery_items;
create policy "household can do everything" on public.grocery_items
  for all to authenticated using (true) with check (true);

-- Let logged-in users reach the tables through the Data API (needed when the
-- project has "Grant API access to new tables automatically" turned off).
-- Row level security above still decides what they can actually do.
grant select, insert, update, delete
  on public.planned_meals, public.grocery_items
  to authenticated;
revoke all on public.planned_meals, public.grocery_items from anon;

-- Live updates: changes on one phone show up on the other straight away.
do $$
begin
  alter publication supabase_realtime add table public.planned_meals;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.grocery_items;
exception when duplicate_object then null;
end $$;
