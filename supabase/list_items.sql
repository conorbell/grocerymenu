-- The Shopping list is independent of Planned meals once filled (docs/adr/0003).
-- Run once in Supabase → SQL Editor, together with the deploy that reads
-- `list_items` (the old site reads `grocery_items` and breaks in between).
--
-- - `grocery_items` is renamed `list_items`: its rows are Shopping list lines.
--   Policies, grants and the realtime publication follow the rename.
-- - Lines no longer remember a Planned meal: removing a Planned meal leaves
--   the list alone.
-- - One line per name (any case) + unit: existing duplicates are merged.
-- - `ever_ticked` makes "items ticked" count each line once.

begin;

alter table public.grocery_items rename to list_items;

drop index if exists public.grocery_items_planned_meal_idx;
alter table public.list_items drop column if exists planned_meal_id;

alter table public.list_items
  add column if not exists ever_ticked boolean not null default false;
update public.list_items set ever_ticked = true where checked;

update public.list_items set name = btrim(name), unit = btrim(unit);

-- Merge lines with the same name + unit into the oldest one.
create temporary table merged on commit drop as
select lower(name) as name_key,
       unit,
       (array_agg(id order by created_at))[1] as keep_id,
       sum(quantity) as quantity,
       bool_and(checked) as checked,
       bool_or(ever_ticked) as ever_ticked
  from public.list_items
 group by lower(name), unit
having count(*) > 1;

update public.list_items l
   set quantity = m.quantity, checked = m.checked, ever_ticked = m.ever_ticked
  from merged m
 where l.id = m.keep_id;

delete from public.list_items l
 using merged m
 where lower(l.name) = m.name_key and l.unit = m.unit and l.id <> m.keep_id;

create unique index if not exists list_items_one_line
  on public.list_items (lower(name), unit);

commit;
