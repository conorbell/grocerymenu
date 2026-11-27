# The Shopping list is independent of Planned meals once filled

Planning a **Meal** adds its Recipe's **Grocery items** to the **Shopping list** once; after that the list doesn't remember which Planned meal put what there. Lines with the same name and unit merge into one amount that anyone can change or remove ("we have one egg left, so 5, not 6"), and removing a Planned meal never touches the list. A Planned meal can't be edited once chosen. We chose this over keeping list rows tied to their meal because the list is what you actually buy, not a sum of recipes. Tied rows made every amount on a meal's line untouchable from the list, and removing one ingredient on the Grocery page silently cut it from a Planned meal.

## Considered Options

- **Rows tied to their Planned meal** (the previous design): the list always matches the plan, but you can't adjust for what's already in the cupboard, and the same item appears split by source.
- **Removing a Planned meal subtracts its amounts**: needs the list to remember who added what, and goes wrong once a merged line has been edited by hand. A short Undo straight after planning covers the real case (planned the wrong meal).

## Consequences

Supersedes the part of ADR-0001 about editing a Planned meal changing its items. The rest of ADR-0001 holds: a Planned meal is still a copy, and editing the Meal never changes it.
