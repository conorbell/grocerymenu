# Spec: Save custom meals to the Menu

Status: done (deployed 2026-11-27)

Vocabulary follows `GLOSSARY.md` (**Menu**, **Meal**, **Recipe**, **Servings**, **Category**, **Planned meal**, **Extra item**). Respects ADR-0001 (a Planned meal is a copy of its Meal) and ADR-0002 (free tiers only).

## Problem Statement

The Menu is a fixed list of 11 Meals that only a code change can alter. When either party member wants a new dish, the Create meal form puts it on this week's shopping list as a one-off, and then it's gone: it never appears on the breakfast, lunch or dinner pages, it can't be picked again next week, it has no photo, and the servings number typed in is forgotten. Neither of them can fix a typo in an existing Meal, change its photo, or remove a Meal they've stopped cooking.

## Solution

The Menu becomes something the party manages from inside the app. Create meal saves a new Meal (with a Category, a Recipe with servings, an optional recipe link, and an optional photo) to the Menu, and can optionally also put it on the list. Either party member can edit or delete any Meal, including the original 11, from the category pages. Picking a Meal asks how many servings and scales the Recipe. Once on the list, a Planned meal is its own copy: it can be adjusted for this week (servings, ingredients) from the checkout page without changing the Meal, and edits to the Meal don't disturb a list in progress. Menu changes show up live on both phones. The whole Menu lives in Supabase, so the old Express server and meals file can be retired. Everything stays within the free Vercel and Supabase plans.

## User Stories

### Creating a Meal

1. As a party member, I want Create meal to save the dish to the Menu, so that we can pick it again in future weeks.
2. As a party member, I want to choose a Category (breakfast, lunch or dinner) for a new Meal, so that it appears on the right menu page.
3. As a party member, I want the Category pre-selected when I open Create meal from the breakfast, lunch or dinner page, so that I don't have to pick the obvious one.
4. As a party member, I want to be made to choose a Category when I open Create meal anywhere else, so that Meals aren't silently filed under the wrong one.
5. As a party member, I want to enter the Recipe's ingredients with quantity and unit, so that the shopping list gets real amounts.
6. As a party member, I want to say how many Servings the Recipe's quantities are for, so that they can be scaled correctly later.
7. As a party member, I want to optionally paste one link to the cooking instructions, so that I can find the full recipe when it's time to cook.
8. As a party member, I want to optionally add a photo, cropped to the menu thumbnail shape, so that the Meal looks like the others on the Menu.
9. As a party member, I want an "Also add to list" option that is unticked by default, so that saving a Meal doesn't put it on the list unless I ask.
10. As a party member, I want ticking "Also add to list" to plan the Meal at the servings I entered, so that I don't have to find it on the Menu straight after creating it.
11. As a party member, I want saving to be refused when the title is already on the Menu, so that we don't end up with two "fish tacos".
12. As a party member, I want saving to be refused when there are no ingredients, so that every Meal adds something to the list.
13. As a party member, I want saving to be refused without a title or Category, so that every Meal can be found.
14. As a party member, I want a clear message saying why saving was refused, so that I can fix it.
15. As a party member, I want creating a Meal to earn EXP on my character sheet, so that adding to the shared Menu is rewarded.

### Seeing the Menu

16. As a party member, I want each category page to list its Meals alphabetically, so that I can scan for a dish quickly.
17. As a party member, I want each menu row to show the Recipe's ingredients and a small "serves N" label, so that I know what a Meal involves without opening it.
18. As a party member, I want a "recipe ↗" link on the row when a Meal has one, opening in a new tab, so that I can get to the instructions.
19. As a party member, I want a Meal without a photo to show without one (no placeholder), so that the Menu doesn't fill with stock images.
20. As a party member, I want a new or edited Meal from my partner to appear on my Menu without reloading, so that we're always looking at the same Menu.
21. As a party member, I want the full `/menu` overview to include new Meals but stay read-only, so that there is one place to manage Meals.
22. As a party member, I want the Grocery page to include ingredients from new Meals, so that every known item is still tickable there.

### Editing and deleting a Meal

23. As a party member, I want an edit action on each menu row that opens the same ticket form filled in with the Meal, so that creating and editing feel the same.
24. As a party member, I want to change any Meal's title, Category, Recipe, servings, link and photo, including the original Meals, so that the Menu stays accurate.
25. As a party member, I want to replace or remove a Meal's photo, so that I can fix a bad picture.
26. As a party member, I want renaming a Meal to keep everyone's favourites on it, so that favourites aren't lost.
27. As a party member, I want renaming to be refused if the new title is already on the Menu, so that titles stay unique.
28. As a party member, I want to delete a Meal from inside the edit form, with a "Delete <title> from the menu?" confirmation, so that I can't delete one by accident.
29. As a party member, I want editing a Meal not to change a Planned meal of it that's already on the list, so that items already in the basket don't change under me mid-shop.
30. As a party member, I want deleting a Meal to leave any Planned meal of it on the list, so that a shop in progress isn't disrupted.
31. As a party member, I want deleting a Meal to remove it from everyone's favourites, so that favourites don't point at nothing.

### Planning a Meal

32. As a party member, I want picking a Meal to use its Recipe's servings by default, so that the usual case is one tap.
33. As a party member, I want to change the servings when picking a Meal, so that quantities scale for guests or leftovers.
34. As a party member, I want picking a Meal that's already on the list to say "already on the list" and offer to change its servings, so that the list never has two copies of one Meal.
35. As a party member, I want picking a Meal to copy its Recipe onto the list as a Planned meal, so that later Menu edits don't affect this week.

### Editing a Planned meal

36. As a party member, I want an edit action next to each Planned meal's remove ✕ on the checkout page, so that I can adjust this week's shop.
37. As a party member, I want to change a Planned meal's servings and have every quantity scale, including ones I edited by hand, so that servings work like a multiplier on what's there.
38. As a party member, I want to add, remove or change a Planned meal's ingredients, so that I can say "we already have cumin this week".
39. As a party member, I want the Planned meal's title to be locked, so that the list keeps matching the Menu.
40. As a party member, I want ticked items to stay ticked when I change servings or edit other ingredients, so that I don't have to re-check things already in the basket.
41. As a party member, I want edits to a Planned meal never to change the Meal on the Menu, so that one week's tweak doesn't rewrite the recipe.
42. As a party member, I want edits to a Planned meal to show live on my partner's phone, so that we shop from the same list.

### Signing in, migration and housekeeping

43. As a visitor who isn't signed in, I want to see a sign-in prompt instead of an empty Menu, so that it's clear why nothing shows.
44. As a party member, I want the original 11 Meals to be on the Menu after the change, with their photos, so that nothing we had is lost.
45. As a party member, I want my existing favourites to still be favourited after the change, so that the switch is invisible.
46. As a party member, I want any old one-off planned meals already on our list to stay until we remove them, so that the current shop isn't disturbed.
47. As a party member, I want photos resized in the browser before upload, so that the app stays inside the free storage plan.
48. As a party member, I want old photo files deleted when a photo is replaced or its Meal is deleted, so that dead files don't use up the free quota.
49. As the developer, I want the Express meals server, the meals file and the meals API route retired, so that there is one source for the Menu.

## Implementation Decisions

### Domain rules module (new, pure)

- A new pure module holds the Menu and Planned meal rules, with no React or Supabase dependency. The store calls it; it's the one test seam.
- Its interface, roughly:
  - **validateMeal(draft, existingMeals)** returns a list of problems: missing title, missing Category, no ingredients, or a title already on the Menu. The uniqueness check is case-insensitive and whitespace-trimmed, and excludes the Meal being edited.
  - **planMeal(meal, servings, currentList)** returns a new Planned meal and its items: ingredient quantities scaled by `servings / meal.servings`, linked to the source Meal, or an "already on the list" result if that Meal is already planned.
  - **rescalePlannedMeal(plannedMeal, items, newServings)** scales every item's quantity by `new / old` servings and preserves `checked`.
  - **editPlannedMealItems(...)** adds, removes or changes items on a Planned meal, keeps the title, and never touches the Meal.
  - **sortMenu(meals)** groups by Category, alphabetical within each.
- Existing helpers for converting an ingredient to an item, and the rounding they use, move here or are reused, so scaling has one implementation.

### Supabase schema (new SQL file, run once in the dashboard)

- **`meals` table**: id, title, category (check: breakfast, lunch, dinner), servings (integer ≥ 1), recipe_url (nullable text), photo_path (nullable), ingredients (jsonb array of `{name, quantity, unit}`), created_by, timestamps. Unique index on lower(trimmed title).
- **`planned_meals`** gains `meal_id` (nullable, references `meals`, `on delete set null`) and `servings` (integer). It stays nullable so that old one-off rows survive and deleting a Meal leaves its Planned meal in place.
- Uniqueness of one Planned meal per Meal is enforced in the rules module. A partial unique index on `planned_meals(meal_id)` where meal_id isn't null backs it up.
- **Favourites** move from title strings to Meal ids. The migration maps existing title favourites to the new Meal ids. Deleting a Meal removes its id from every profile's favourites, via a trigger or the delete flow.
- **Stats**: a new lifetime counter `meals_created`, bumped through the existing stats RPC (extend it with a parameter) and shown with EXP on the character sheet.
- **Photos**: a new storage bucket for meal photos, following the avatars bucket's pattern.
- **Policies**: the existing household rule applies. Any signed-in user can read and write `meals` and the bucket; signed-out users get nothing. Explicit grants are required, because auto-grant is off.
- **Realtime**: `meals` is added to the realtime publication.
- **Seed**: the migration inserts the 11 current Meals with their Category, ingredients, servings of 1 (today's implicit value), and photo paths.

### Store

- The store loads the Menu from Supabase instead of the meals API, subscribes to `meals` changes, and exposes Menu operations: create, update, delete, plan with servings, rescale and edit a Planned meal.
- The existing add-meal path is replaced by planning from a Meal. One-off planned meals can no longer be created. Standalone things like "takeout" go on the list as Extra items, which already works.
- Logged-out mode goes away: no Menu or list without a session. The localStorage list path and its keys can be removed. The meals-loading hook is replaced by reading from the store.
- Favourites helpers take a Meal id instead of a title.

### UI

- **Create meal ticket**: adds a Category picker (pre-selected on category pages, otherwise required), a servings field (kept, now stored), a recipe link field, a photo picker using the existing resize and crop pipeline cropped to the menu thumbnail shape, and an "Also add to list" checkbox (unticked). Validation messages come from the rules module.
- **Same ticket in edit mode**: opened from a new edit action on each category-page menu row and filled in with the Meal. It includes Delete with a confirmation, and replacing or removing the photo deletes the old file.
- **Menu row**: shows "serves N" and a "recipe ↗" link when present. Picking a Meal asks for servings, defaulting to the Recipe's. If the Meal is already planned, it says "already on the list" and offers to change servings.
- **Checkout**: each Planned meal gets an edit action next to ✕, opening the ticket with servings and ingredients editable and the title locked.
- **Signed-out state**: a sign-in prompt replaces the Menu and list pages.
- **`/menu`** stays read-only and reads from the store.
- Design rules apply throughout: the purple ticket style, no rounded corners, no soft shadows or pills, and "party member", never "list-mate".

### Retirement

- Once the Menu reads from Supabase: remove the Express meals server, the meals JSON file, the meals API route, and the dev script's server half. Shrink the 11 original photos to about 800px JPEGs and upload them to the bucket as part of the seed, and drop the copy-food step from the build.

## Testing Decisions

- **A good test** checks external behaviour through the rules module's interface: given a Meal, a list and an action, what comes back. Tests don't reach into internals, mock the store, or assert on Supabase calls. A test should still pass after a refactor that keeps behaviour the same.
- **Tested module**: the domain rules module only. Cases:
  - validateMeal: duplicate titles (case and whitespace variants), editing a Meal keeping its own title, missing Category, zero ingredients, and blank ingredient rows ignored.
  - planMeal: scaling from servings (e.g. recipe for 2 planned for 3), rounding, planning an already-planned Meal, and the copy's independence from later Meal changes.
  - rescalePlannedMeal: hand-edited quantities scale too, and ticked items stay ticked.
  - editPlannedMealItems: the title is unchanged, and adding or removing items keeps the others.
  - sortMenu: alphabetical within each Category, regardless of input order.
- **Setup**: Jest is installed but not wired up. Add a `test` script and a Jest config that uses the existing Babel config, with a Node environment because the module is pure. Delete the broken placeholder test.
- **Prior art**: none usable. The one existing test is a broken placeholder.
- **Not automatically tested**: Supabase queries, policies, realtime, photo upload, and the screens. Verify these by hand in the running app with both accounts: create, edit, delete, plan, edit a Planned meal, and the live update on a second browser.

## Out of Scope

- Cooking steps or a recipe detail page. A Recipe is ingredients plus servings plus an optional link.
- Meals in more than one Category.
- Grouping the shopping list by aisle.
- Removing or redesigning the `/menu` page. It may be redundant, but that's a separate decision.
- Ingredient name normalisation (e.g. "egg" vs "eggs").
- A public or signed-out view of the Menu.
- Any paid plan or new paid service (ADR-0002).
- The other handoff clean-ups (`styles.css` duplicates, unused dependencies, `npm audit`), except removing the Express and meals file this feature replaces.

## Further Notes

- The SQL must be run by hand in the Supabase dashboard, like the existing files, and is written to be safe to re-run.
- Deploy order matters. Run the SQL and seed (including photo uploads) first, then deploy the app that reads from `meals`. The old app keeps working against the old tables until then, because `planned_meals` only gains nullable columns.
- Free-plan budget: 11 seed photos at about 100 KB each plus new uploads is a few MB of the 1 GB free storage.
- Work lives on the local `forks-ready` branch. Don't push to GitHub `main`, which is a different app.
