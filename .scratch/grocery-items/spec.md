# Spec: Grocery items and an independent Shopping list

Status: ready (designed 2026-11-27, not started)

Vocabulary follows `GLOSSARY.md` (**Menu**, **Meal**, **Recipe**, **Servings**, **Planned meal**, **Grocery item**, **Shopping list**). Implements ADR-0003 (the Shopping list is independent of Planned meals once filled), which partly supersedes ADR-0001. Respects ADR-0002 (free tiers only).

## Problem Statement

The Shopping list can't be adjusted to what's already in the cupboard. Every line a Planned meal adds is tied to that meal, so if there's one egg left there's no way to buy 5 instead of 6, and nothing added by hand can have its amount changed either: the only options are add or ✕. The same item shows split by source ("eggs ×6" from a meal, "eggs ×2" by hand, an "extra" tag on one).

The Grocery page isn't a real list of things the household buys. It's rebuilt on every visit from Meal ingredients plus whatever is on the list, so items can't be removed from it, anything added by hand is forgotten once it's cleared off the list, a tap always adds "×1" with no unit, and untapping an item deletes it from every Planned meal that uses it. It's one long A–Z list with filter tabs, which won't hold up with hundreds of items.

Adding things happens in two half-overlapping places (the Grocery page and the List page's add form), and "Start over" wipes things nobody has bought yet.

## Solution

Planning a Meal puts its ingredients on the Shopping list once; from then on the list is its own thing. Each line is one Grocery item in one unit, with one amount that anyone can change or remove from either page. Planned meals become a fixed record of what's being cooked: no editing, and removing one doesn't touch the list. A short Undo straight after planning covers picking the wrong meal.

The household gets a saved list of Grocery items, filled automatically from Meal Recipes and from anything added to the list, remembering the amount last used for each. The Grocery page becomes the place to build the list: search that also adds new items, an "On the list" section with amount controls at the top, and everything else A–Z below. An Edit mode removes, renames and merges Grocery items. The List page is for shopping: tick off, adjust, share, clear, and start a New list that keeps whatever wasn't bought.

## User Stories

### Building the list on the Grocery page

1. As a party member, I want a search box at the top of the Grocery page that narrows the items as I type, so that I can find one in a long list without scrolling.
2. As a party member, I want the search to offer **+ Add "oat milk"** when nothing matches, so that I can add a new Grocery item and put it on the list in one step.
3. As a party member, I want what's already on the Shopping list shown first, in its own "On the list" section, so that I can see what we're getting before adding more.
4. As a party member, I want everything not on the list below that, A–Z with letter headings, so that I can browse when I don't know what I'm looking for.
5. As a party member, I want one tap on an item to put it on the list with the amount and unit we used for it last time (×1 the first time), so that the usual case takes one tap.
6. As a party member, I want ticked (bought) items shown struck through in "On the list", with no tick box there, so that ticking only happens in one place.
7. As a party member, I want the All / On list / Not on list tabs gone, so that the page has one way of filtering: search.

### Amounts

8. As a party member, I want each line on both pages to have **− amount +** controls, so that I can change how much we're getting.
9. As a party member, I want to tap the amount and type a number, so that big changes don't take twenty taps.
10. As a party member, I want pressing − at the smallest step to take the line off the list, so that removing is the same gesture as reducing.
11. As a party member, I want changing a line's amount to become that item's remembered amount, so that next time it's added the same way.
12. As a party member, I want lines with the same name and unit to always be one line with one amount, so that "eggs" appears once, however it got there.
13. As a party member, I want lines with different units to stay separate (milk 1 cup, milk 1 bottle), so that the app never guesses a conversion.

### Planned meals

14. As a party member, I want planning a Meal to add its ingredients to the list, adding to any matching line already there, so that the list stays one line per item.
15. As a party member, I want to be able to change or remove any line a Planned meal added, so that I can account for what's already in the cupboard.
16. As a party member, I want an **Undo** for a few seconds after planning a Meal that removes the meal and exactly what it added, so that picking the wrong meal costs nothing.
17. As a party member, I want removing a Planned meal never to change the list, so that what I've already adjusted or bought isn't undone.
18. As a party member, I want a Planned meal to keep the servings it was planned at, with no edit action, so that "what we're cooking" is a plain record.
19. As a party member, I want a Meal that's already planned to say "on the list" on its menu page instead of offering to change servings, so that the page matches the rule.

### Shopping on the List page

20. As a party member, I want to tick lines off on the List page, so that I can track what's in the basket.
21. As a party member, I want a small add box on the List page, so that something remembered at the last minute can go straight on.
22. As a party member, I want **New list** to remove the Planned meals and everything ticked while keeping everything unticked, after asking me, so that unbought items carry over.
23. As a party member, I want Clear ticked kept, so that I can tidy the list part way through.
24. As a party member, I want "Items ticked" on my character sheet to count each line once, however often I untick and re-tick it, so that the stat means something.

### Managing Grocery items

25. As a party member, I want every Grocery item from a Meal's Recipe and everything ever put on the list saved automatically, so that I never have to maintain the list by hand.
26. As a party member, I want an **Edit** toggle on the Grocery page that shows remove and rename on every row, so that I can clean up typos without cluttering the everyday view.
27. As a party member, I want to remove a Grocery item, so that things we'll never buy again stop showing up. If a Meal still uses it, planning that Meal brings it back.
28. As a party member, I want renaming a Grocery item to an existing name to merge the two, updating every Meal and line that used the old name, so that "Egg" and "Eggs" become one item.
29. As a party member, I want ingredient and item name fields (Create meal, both add boxes) to suggest existing Grocery items as I type, so that duplicates don't get made in the first place.
30. As a party member, I want all of this to update live on my party member's phone, so that we're looking at the same list.

## Implementation Decisions

### Pure modules (the test seam)

- **`src/lib/list.js`** keeps its shape: every change returns `{ next, writes, stats }` and `runWrites` in the store stays the only list code that talks to Supabase. Its list is now `{ plannedMeals, items }` where `items` are list lines `{ id, name, quantity, unit, checked, ever_ticked }`, with no `planned_meal_id`.
  - **plan(list, meal, servings)** scales the Recipe (existing `planMeal` scaling), then for each ingredient either adds to the matching line (lower-cased trimmed name + unit) or inserts a new line. It also returns an **undo** change: delete the Planned meal, delete lines it created, subtract the quantities it added to existing lines. The store holds this in memory for the Undo window. If a party member changed one of those lines in the meantime, the undo subtracts from the current amount and removes the line at ≤ 0.
  - **add(list, { name, quantity, unit })** adds to the matching line or inserts one. Replaces `addExtra`.
  - **setAmount(list, line, quantity)** updates a line; a quantity ≤ 0 deletes it.
  - **toggle(list, line)** flips `checked`; returns `stats.ticked = 1` only when ticking a line whose `ever_ticked` is false, and sets it.
  - **removeLine**, **clearChecked** stay. **removePlanned** deletes only the Planned meal row.
  - **newList(list)** deletes all Planned meals and ticked lines.
  - **Removed:** `groupItems` (lines are already one per name + unit, so `groceryList` is just the lines), `editPlanned`, `rescalePlanned`, `itemsOf`, `clearAll`. `mealRules.js` loses `rescalePlannedMeal` and `editPlannedMeal`.
- **`src/lib/groceryItems.js`** (new, pure): the saved Grocery items.
  - **remember(groceryItems, names/amounts)** returns the upserts needed after a Meal save or a list add (new names inserted; the remembered amount and unit updated for list adds).
  - **rename(groceryItems, meals, list, item, newName)** returns the writes to rename, or to merge when the new name already exists: Meal ingredient names rewritten, list lines renamed and merged with any line of the same name and unit (quantities added, ticked only if both were), the old Grocery item deleted.
  - **catalogue view**: given Grocery items, the list and a search query, returns the "On the list" lines and the A–Z letter groups for the page, plus whether to offer "+ Add".

### Supabase schema (`supabase/list_items.sql` for issue 01, `supabase/grocery_items.sql` for issue 02; each run once in the dashboard alongside its deploy)

- **Rename** the existing `grocery_items` table to `list_items` (it holds Shopping list lines). Policies, grants and the realtime publication follow the table. The old deployed client breaks between running the SQL and deploying, so do both together.
- **`list_items`:** drop `planned_meal_id` (and its index and cascade). Add `ever_ticked boolean not null default false`, set to `checked` for existing rows. Merge existing duplicate rows per lower(trim(name)) + unit (sum quantities, checked if all were), then add a unique index on `(lower(trim(name)), unit)`.
- **New `grocery_items`:** `id, name, last_quantity numeric, last_unit text, created_at`, unique on `lower(trim(name))`. Backfilled from every Meal's ingredients and every current list line. Household RLS policy, explicit grants to `authenticated`, nothing for `anon`, added to realtime.
- **`planned_meals`:** unchanged (`id, title, meal_id, servings`).
- `bump_my_stats` is unchanged: the per-line `ever_ticked` flag means a tick is only ever counted once, so no negative counts are needed.

### Store (`ListContextWrapper.js`)

- Loads and subscribes to `list_items` and `grocery_items`. Exposes the new list changes, the Grocery item changes, and the pending Undo.
- Saving a Meal and adding to the list also write the `remember` upserts.
- `updatePlannedMeal`, `setPlannedServings` and `clearLists` go.

### UI

- **Amount control:** one component, `− amount +`, the amount a tap-to-type field. Steps of 1 for counts, the unit's natural step otherwise. Used on both pages.
- **Grocery page:** search box (also the add box) → "On the list" → A–Z with letter headings. An Edit toggle shows ✕ and rename per row. The filter tabs and their CSS go.
- **List page:** lines with tick + amount control + ✕; small add box; Share; Clear ticked; **New list** (with a confirm saying how many unticked items stay). The "extra" tag, the Planned meal edit action and `EditPlannedMeal` go. The Meals column keeps its ✕.
- **Menu pages:** a planned Meal shows "on the list"; the change-servings note goes.
- **Undo:** the existing "[adds … to the list]" caption gets an Undo button for its 2.5 s, extended to about 5 s when it has one.
- **Suggestions:** a native `<datalist>` of Grocery item names on the Create meal ingredient fields and both add boxes.
- Design rules apply: no rounded corners, no soft shadows or pills, ruled rows and dotted leaders as on the current list, "party member", never "list-mate".

## Testing Decisions

- **A good test** checks behaviour through the pure modules' interfaces: given a list (and Grocery items, Meals), an action, and what comes back as `next`, `writes`, `stats`. No mocking the store or Supabase. Tests should survive a refactor that keeps behaviour.
- **`list.test.js`** (rewrite the affected cases): plan merges into an existing line by name (any case) + unit and keeps different units apart; plan's undo restores the list exactly, and still behaves when a line was changed or removed in between; setAmount to 0 removes; toggle counts a tick once across untick/re-tick; removePlanned leaves lines alone; newList keeps unticked lines.
- **`groceryItems.test.js`** (new): remember inserts new names only and updates the remembered amount; rename merges Meals' ingredient names and list lines (quantities added, ticked state); the page view puts on-list lines first, groups the rest by first letter, and offers "+ Add" only when no name matches.
- **Not automatically tested:** the SQL migration, realtime, and the screens. Check by hand in the running app with both accounts. **Ask before any write to the live list**; better, run the migration on a copy first if the free plan allows a second project, otherwise snapshot `grocery_items` / `planned_meals` with a select before running it.

## Out of Scope

- Aisle grouping (the A–Z letter headings are where it will slot in later).
- Unit conversion or "keep stocked" flags for pantry items.
- Editing a Planned meal in any way.
- Any idea of a week or calendar.
- Changes to how Meals are created or edited, beyond the name suggestions.

## Further Notes

- The `items_ticked` double count from `docs/HANDOFF.md` is fixed here (story 24).
- The bug where untapping an item on the Grocery page deleted it from Planned meals goes away with the link between lines and meals.
- Update `docs/HANDOFF.md` (architecture, data model, Supabase table) when this lands.
