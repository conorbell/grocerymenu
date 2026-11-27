# A Planned meal is a copy of its Meal, not a live link

When a **Meal** is picked for the shopping list, the **Planned meal** takes its own copy of the ingredients and quantities. Editing the Meal on the Menu never changes a Planned meal already on the list, and editing a Planned meal (servings, ingredients) never changes the Meal; deleting the Meal leaves the Planned meal in place. We chose this over a live link so that a party member editing a recipe can't silently change or remove items the other has already ticked off mid-shop, and so this week's tweaks ("less tilapia") don't rewrite the recipe for good.

_Partly superseded by ADR-0003: Planned meals can no longer be edited, and the Shopping list is independent of them once filled. The copy-not-link rule above still holds._
