# Forks Ready

A shared meal planner and shopping list for one household. The party picks **Meals** from the **Menu**, and their ingredients land on the shared shopping list.

## Language

**Menu**:
Every **Meal** the household has saved, grouped by **Category**.
_Avoid_: Catalogue, recipe book

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
A copy of a **Meal** selected for the current shopping list. Changing a planned meal never changes its **Meal**, and changing the **Meal** never changes a planned meal already on the list. Every planned meal comes from a **Meal**, there are no one-off planned meals, and a **Meal** is planned at most once per list.
_Avoid_: Selected meal, list meal

**Extra item**:
Something on the shopping list that doesn't belong to any **Planned meal**.
_Avoid_: Standalone item, one-off
