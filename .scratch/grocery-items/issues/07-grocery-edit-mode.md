# 07: Grocery page Edit mode: remove, rename, merge

Status: done (2026-11-27)
Blocked by: 02, 04
Spec: ../spec.md (stories 26-28)

An Edit toggle shows ✕ and rename on each row. Renaming to an existing name merges: Meal ingredient names rewritten, list lines renamed and merged, the old Grocery item deleted (`rename` in `lib/groceryItems.js`, tested).

Done when: renaming "Egg" to "Eggs" leaves one item, updates the Meals that used it, and merges any list lines.
