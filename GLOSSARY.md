# Forks Ready

A shared meal planner and shopping list for one household. The party picks **Meals** from the **Menu**, and their ingredients land on the shared shopping list.

## Language

**Menu**:
Every **Meal** the household has saved, grouped by **Category**.
_Avoid_: Catalog, catalogue, recipe book

**Meal**:
A dish saved on the **Menu**, belonging to exactly one **Category** and containing a **Recipe**.
_Avoid_: Menu item, dish

**Recipe**:
The part of a **Meal** that says what to buy: its ingredients and quantities, written for a stated number of **Servings**, and optionally a link to cooking instructions elsewhere.

**Servings**:
How many people a **Recipe**'s quantities are written for; picking a **Meal** for a different number scales the quantities.

**Category**:
One of breakfast, lunch or dinner; every **Meal** has exactly one.
_Avoid_: Course, section

**Planned meal**:
A **Meal** chosen for the current **Shopping list** at a number of **Servings**; it can't be changed after that. Choosing it adds its **Recipe**'s **Grocery items** to the **Shopping list** once, and from then on the list is independent of it. Changing the **Meal** never changes a planned meal. Every planned meal comes from a **Meal**, and a **Meal** is planned at most once at a time.
_Avoid_: Selected meal, list meal, meal for the week

**Grocery item**:
Anything bought at the grocery store, whether or not a **Meal** uses it: olive oil, butter, a bag of apples.
_Avoid_: Ingredient (when it isn't in a **Recipe**), product

**Shopping list**:
The household's one shared list of **Grocery items** to buy, each with one amount, whether a **Planned meal** or a person put it there.
_Avoid_: Grocery list, checkout, extra item
