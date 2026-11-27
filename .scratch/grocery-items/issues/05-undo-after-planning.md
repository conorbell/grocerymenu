# 05: Undo after planning a Meal

Status: done (2026-11-27)
Blocked by: 01
Spec: ../spec.md (story 16)

`plan` returns an undo change; the store keeps it while the "[adds … to the list]" caption shows (about 5 s), and the caption gets an Undo button.

Done when: Undo restores the list exactly, including amounts merged into existing lines, and copes with a line changed or removed in the meantime (tests).
