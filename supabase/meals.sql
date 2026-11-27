-- Grocery Menu: the Menu (saved Meals) in Supabase, replacing meals.json.
-- Run AFTER schema.sql, profiles.sql and profile_stats.sql.
-- Paste into Supabase → SQL Editor → New query → Run. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Meals on the Menu. A Meal's Recipe is its ingredients (quantities written
-- for `servings` people) plus an optional link to cooking instructions.
create table if not exists public.meals (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(btrim(title)) between 1 and 80),
  category    text not null check (category in ('breakfast', 'lunch', 'dinner')),
  servings    integer not null default 1 check (servings between 1 and 50),
  recipe_url  text check (recipe_url is null or recipe_url ~* '^https?://'),
  photo_url   text,
  ingredients jsonb not null default '[]'
              check (jsonb_typeof(ingredients) = 'array' and jsonb_array_length(ingredients) between 1 and 60),
  created_by  uuid references auth.users (id) default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One name per Meal on the Menu (ignoring case and surrounding spaces).
create unique index if not exists meals_title_unique on public.meals (lower(btrim(title)));

drop trigger if exists meals_touch_updated_at on public.meals;
create trigger meals_touch_updated_at
  before update on public.meals
  for each row execute function public.touch_updated_at();

-- Household rule: everyone logged in can read and change every Meal.
alter table public.meals enable row level security;
drop policy if exists "household can do everything" on public.meals;
create policy "household can do everything" on public.meals
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.meals to authenticated;
revoke all on public.meals from anon;

do $$
begin
  alter publication supabase_realtime add table public.meals;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- The original menu (was server/data/meals.json). Photos are served by the
-- site from /food until someone replaces them. Only seeds an empty Menu, so
-- re-running this file never brings back Meals you've renamed or deleted.
insert into public.meals (title, category, servings, photo_url, ingredients)
select v.title, v.category, v.servings, v.photo_url, v.ingredients
  from (values
  ('rigatoni alla zaza', 'dinner', 1, '/food/rigatoni-alla-zaza.jpg', '[{"name":"pancetta","quantity":1,"unit":""}]'::jsonb),
  ('fish tacos', 'dinner', 1, '/food/fish-tacos.jpg', '[{"name":"tilapia","quantity":1,"unit":""},{"name":"small tortillas","quantity":1,"unit":""},{"name":"pico de gallo","quantity":1,"unit":""},{"name":"small milk","quantity":1,"unit":""},{"name":"shredded red and green cabbage","quantity":1,"unit":""},{"name":"chipotle peppers sauce thin","quantity":1,"unit":""},{"name":"sour cream","quantity":1,"unit":""}]'::jsonb),
  ('Shrimp cumin ginger', 'dinner', 1, '/food/shrimp-cumin-ginger.jpg', '[{"name":"shrimp","quantity":1,"unit":""},{"name":"ginger","quantity":1,"unit":""},{"name":"cumin","quantity":1,"unit":""},{"name":"lime","quantity":1,"unit":""},{"name":"cilantro","quantity":1,"unit":""}]'::jsonb),
  ('Frozen Pizza', 'dinner', 1, '/food/frozen-pizza.jpg', '[{"name":"frozen pizza","quantity":1,"unit":""}]'::jsonb),
  ('Corned Beef Hash', 'breakfast', 1, '/food/corned-beef-hash.jpg', '[{"name":"yellow onion","quantity":1,"unit":""},{"name":"small potatoes","quantity":2,"unit":""},{"name":"egg","quantity":1,"unit":""},{"name":"corned beef","quantity":1,"unit":""}]'::jsonb),
  ('Black Pepper Beef and Cabbage Stir Fry', 'dinner', 1, '/food/black-pepper-beef-and-cabbage-stir-fry.jpg', '[{"name":"shaved steak","quantity":1,"unit":""},{"name":"garlic","quantity":1,"unit":""},{"name":"brown sugar","quantity":1,"unit":""},{"name":"green cabbage","quantity":1,"unit":""},{"name":"scallions","quantity":1,"unit":""},{"name":"cornstarch","quantity":1,"unit":""},{"name":"sherry vinegar","quantity":1,"unit":""}]'::jsonb),
  ('Carne Asada', 'dinner', 1, '/food/carne-asada.jpg', '[{"name":"Carne asada","quantity":1,"unit":""},{"name":"gold potatoes","quantity":1,"unit":""}]'::jsonb),
  ('Chicken Quesadilla', 'lunch', 1, '/food/chicken-quesadilla.jpg', '[{"name":"grilled chicken","quantity":1,"unit":""},{"name":"big tortillas","quantity":1,"unit":""},{"name":"shredded ched","quantity":1,"unit":""}]'::jsonb),
  ('Hard Boiled Eggs', 'breakfast', 1, '/food/hard-boiled-eggs.jpg', '[{"name":"egg","quantity":1,"unit":""}]'::jsonb),
  ('Veggie Burritos', 'dinner', 1, '/food/veggie-burritos.jpg', '[{"name":"big tortillas","quantity":1,"unit":""},{"name":"red onion","quantity":1,"unit":""},{"name":"greens","quantity":1,"unit":""},{"name":"bell pepper","quantity":1,"unit":""},{"name":"cheese","quantity":1,"unit":""}]'::jsonb),
  ('Overnight Oats', 'breakfast', 1, '/food/overnight-oats.jpg', '[{"name":"oats","quantity":1,"unit":""},{"name":"chia seeds","quantity":1,"unit":""},{"name":"frozen berry blend","quantity":1,"unit":""},{"name":"peanut butter","quantity":1,"unit":""},{"name":"oat milk","quantity":1,"unit":""}]'::jsonb)
  ) as v (title, category, servings, photo_url, ingredients)
 where not exists (select 1 from public.meals)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Planned meals now remember which Meal they were copied from and for how
-- many servings. Both stay empty on old one-off planned meals. Deleting a
-- Meal leaves its Planned meal on the list (see docs/adr/0001).
alter table public.planned_meals
  add column if not exists meal_id  uuid references public.meals (id) on delete set null,
  add column if not exists servings integer check (servings between 1 and 50);

-- Link planned meals already on the list to their Meal by title (first one
-- only, since a Meal is planned at most once per list).
with matches as (
  select p.id as planned_id, m.id as meal_id,
         row_number() over (partition by m.id order by p.created_at) as n
    from public.planned_meals p
    join public.meals m on lower(btrim(m.title)) = lower(btrim(p.title))
   where p.meal_id is null
     and not exists (select 1 from public.planned_meals q where q.meal_id = m.id)
)
update public.planned_meals p
   set meal_id = matches.meal_id, servings = coalesce(p.servings, 1)
  from matches
 where p.id = matches.planned_id and matches.n = 1;

create unique index if not exists planned_meals_one_per_meal
  on public.planned_meals (meal_id) where meal_id is not null;

-- ---------------------------------------------------------------------------
-- Favourites point at Meals by id instead of by title, so renames keep them.
-- Entries that are already ids are kept; titles are swapped for their Meal's
-- id; anything not on the Menu is dropped.
update public.profiles p
   set favorites = coalesce((
         select array_agg(distinct m.id::text)
           from unnest(p.favorites) f
           join public.meals m on m.id::text = f or lower(btrim(m.title)) = lower(btrim(f))
       ), '{}')
 where cardinality(p.favorites) > 0;

-- Deleting a Meal takes it out of everyone's favourites.
create or replace function public.forget_deleted_meal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set favorites = array_remove(favorites, old.id::text)
   where old.id::text = any (favorites);
  return old;
end;
$$;

drop trigger if exists meals_forget_favorites on public.meals;
create trigger meals_forget_favorites
  after delete on public.meals
  for each row execute function public.forget_deleted_meal();

-- ---------------------------------------------------------------------------
-- New lifetime counter: Meals you've added to the Menu.
alter table public.profiles
  add column if not exists meals_created integer not null default 0;

drop function if exists public.bump_my_stats(integer, integer, integer);
create or replace function public.bump_my_stats(
  meals   integer default 0,
  added   integer default 0,
  ticked  integer default 0,
  created integer default 0
)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.profiles
     set meals_planned = meals_planned + least(greatest(meals, 0), 50),
         items_added   = items_added   + least(greatest(added, 0), 200),
         items_ticked  = items_ticked  + least(greatest(ticked, 0), 200),
         meals_created = meals_created + least(greatest(created, 0), 10)
   where id = (select auth.uid());
$$;

revoke all on function public.bump_my_stats(integer, integer, integer, integer) from public, anon;
grant execute on function public.bump_my_stats(integer, integer, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Meal photos. Public bucket like avatars; files live at <meal id>/<time>.jpg.
-- Any party member can add, replace or remove any Meal's photo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', true, 2097152, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "meal photos: read" on storage.objects;
create policy "meal photos: read" on storage.objects
  for select to authenticated using (bucket_id = 'meal-photos');

drop policy if exists "meal photos: upload" on storage.objects;
create policy "meal photos: upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'meal-photos');

drop policy if exists "meal photos: update" on storage.objects;
create policy "meal photos: update" on storage.objects
  for update to authenticated using (bucket_id = 'meal-photos');

drop policy if exists "meal photos: delete" on storage.objects;
create policy "meal photos: delete" on storage.objects
  for delete to authenticated using (bucket_id = 'meal-photos');
