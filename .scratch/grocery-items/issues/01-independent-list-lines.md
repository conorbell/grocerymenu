# 01: Shopping list lines independent of Planned meals

Status: done (migration run and deployed 2026-11-27)
Blocked by: none
Spec: ../spec.md (stories 12-15, 17-20, 24; ADR-0003)

Run `supabase/list_items.sql` (rename `grocery_items` → `list_items`, drop `planned_meal_id`, add `ever_ticked`, merge duplicate lines, unique index) and ship the matching code in the same deploy.

- `lib/list.js`: plan merges into lines by name + unit; `add` replaces `addExtra`; `toggle` counts a tick once via `ever_ticked`; `removePlanned` leaves lines; drop `groupItems`, `editPlanned`, `rescalePlanned`, `clearAll` (and the two Planned meal edit rules in `mealRules.js`).
- Store reads/subscribes to `list_items`; drops `updatePlannedMeal`, `setPlannedServings`.
- List page: no "extra" tag, no Planned meal edit action; delete `EditPlannedMeal`.
- Menu pages: a planned Meal shows "on the list", no change-servings note.
- Grocery page keeps working on the new line shape (untap removes that item's lines only).

Done when: tests for the cases in the spec pass, and both accounts see a merged list live. Ask before writing to the live list.
