-- Grocery items: everything the household buys, remembered whether or not
-- it's on the Shopping list (see GLOSSARY.md). Run AFTER list_items.sql.
-- Paste into Supabase → SQL Editor → New query → Run. Safe to re-run.

create table if not exists public.grocery_items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (btrim(name) <> ''),
  -- the amount used last time, so one tap adds it again (null = never set)
  last_quantity numeric check (last_quantity > 0),
  last_unit     text not null default '',
  created_at    timestamptz not null default now()
);

create unique index if not exists grocery_items_one_per_name
  on public.grocery_items (lower(name));

-- Everything on the list now (with its amount), then every Meal ingredient.
insert into public.grocery_items (name, last_quantity, last_unit)
select distinct on (lower(btrim(name))) btrim(name), quantity, unit
  from public.list_items
 order by lower(btrim(name)), created_at desc
on conflict ((lower(name))) do nothing;

insert into public.grocery_items (name)
select distinct on (lower(btrim(ing ->> 'name'))) btrim(ing ->> 'name')
  from public.meals, jsonb_array_elements(ingredients) as ing
 where btrim(coalesce(ing ->> 'name', '')) <> ''
 order by lower(btrim(ing ->> 'name'))
on conflict ((lower(name))) do nothing;

-- One household: anyone logged in can read and edit; logged out, nothing.
alter table public.grocery_items enable row level security;

drop policy if exists "household can do everything" on public.grocery_items;
create policy "household can do everything" on public.grocery_items
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.grocery_items to authenticated;
revoke all on public.grocery_items from anon;

do $$
begin
  alter publication supabase_realtime add table public.grocery_items;
exception when duplicate_object then null;
end $$;
