# 02: Saved Grocery items

Status: ready
Blocked by: 01
Spec: ../spec.md (stories 25, 30)

Create `grocery_items` (name unique case-insensitive, last_quantity, last_unit), backfill from Meals and the list, with RLS, grants and realtime. New pure `lib/groceryItems.js` `remember`. Saving a Meal and adding to the list upsert into it. The Grocery page reads its rows from this table instead of deriving them.

Done when: a hand-added item is still on the Grocery page after it's cleared off the list.
