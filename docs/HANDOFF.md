# Handoff: Grocery Menu ("Forks Ready")

_Last updated: 2026-11-27. Read this first when picking the project back up._

A shared meal-planner + grocery list for a two-person household. Pick meals from a menu, their ingredients land on a shared
shopping list that both phones see live. Also has RPG-style profiles, a party
HUD, and a household chat.

- **Live:** https://grocerymenu-lyart.vercel.app (Vercel project `grocerymenu`)
- **Backend:** Supabase (auth, Postgres, Realtime, Storage)
- **Frontend:** React 18 + React Router 6, bundled with webpack (no framework)

---

## ⚠️ Read before touching git

- **Work lives on branch `forks-ready`**, pushed to GitHub
  (`origin/forks-ready`, tracking set up). `gh` is logged in on this Mac, and this
  repo's git config raises `http.postBuffer` (pushes with photos failed with
  HTTP 400 without it). Just `git push` from `forks-ready`.
- **Local `main` is 25 commits behind GitHub `main`**, and GitHub `main` is a
  *different app* (a Next.js + Supabase rewrite from June 2024). Do **not** push
  this to `main` or pull `main` over it. Decide later which version becomes `main`.
- `dist/` and `.DS_Store` are gitignored.
- Vercel's GitHub integration was **disconnected on purpose** so pushes to
  GitHub `main` can't overwrite the live site. Deploy from this folder (below).

---

## Running it

```bash
npm install
npm run dev        # webpack dev server :8080
npm test           # Jest: src/lib/mealRules.js + src/lib/list.js
```

- Needs `.env` (gitignored) with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
  (publishable key, safe in the browser; RLS protects data). See `.env.example`.
- `webpack.config.js` bakes the Supabase env vars in via `DefinePlugin`, so
  **restart `npm run dev` after editing `.env`**.
- **You must be logged in.** Logged out, the Menu, list and grocery pages show a
  sign-in prompt (no browser-only lists any more).
- Only one `npm run dev` at a time (port 8080).
- `package.json` pins Node `26.x` for Vercel (18.x was discontinued). This Mac
  uses Node 26 via Volta (`volta install node@26`).

**Deploy:** `vercel deploy --prod` from the repo root (CLI is logged in). Vercel
builds `npm run build` → `dist/` (copying `public/food` → `dist/food`) and
rewrites every non-`/food` path to `index.html`. Supabase env vars are set in the
Vercel project (Production).

**Dev-only preview:** `/user/preview` shows the profile, party HUD, settings,
stat allocation and a chat demo with sample data, no login needed. Stripped
from production builds.

---

## Architecture

```
src/
  Routes.jsx                 routes; App = ListProvider > ChatProvider > Router
  CustomErrorBoundary.jsx    route error element
  layouts/RootLayout.jsx     header nav, per-page theme, corner pills, chat,
                               nav hover sounds (public/*.mp3 via use-sound)
  layouts/UserLayout.jsx     outlet wrapper for /user routes
  lib/
    supabase.js              client (null when not configured)
    mealRules.js             pure Menu/Planned meal rules (validate, plan, rescale,
                               edit, sort) + the category list; tested
    list.js                  pure shopping-list changes: each returns
                               { next, writes, stats } (writes = plain data);
                               line grouping + amounts; tested
    rpgStats.js              LV/EXP/HP/MP/class/stats + stat points (tweak here)
    ingredients.js           ingredient labels (Meals store {name,quantity,unit})
    shareList.js             "Share list" text + share sheet / copy fallback
    image.js                 resize/crop photos before upload
    units.js                 unit dropdown values
  components/
    functions/ListContextWrapper.js   THE store: Menu (meals table), auth,
                                       profiles, favourites, stats, presence;
                                       list changes come from lib/list.js and
                                       are saved by runWrites (the only list
                                       code that talks to Supabase)
    functions/ChatContext.js          chat: load-by-day, realtime, typing, reads
    CreateMeal.jsx                    create/edit a Meal ticket + edit a
                                       Planned meal ticket
    ChatPanel.jsx, PhotoCropper.jsx, SignInPrompt.jsx, Avatar.jsx, HeartIcon.jsx
    main.js                           Home (cat photo slideshow)
    pages/Grocery.jsx                 /grocery – every known item, tick to add/remove
    pages/menus/MealMenu.jsx          /breakfast /lunch /dinner (add, servings
                                       stepper, edit, recipe link, favourite);
                                       Breakfast/Lunch/Dinner.jsx are one-line
                                       wrappers passing the category
    pages/menus/Checkout.jsx          /checkout – shared list, add extra items,
                                       tick off, Share list
    pages/user/Account.jsx            /user – character sheet, party HUD,
                                       edit profile (+ photo crop), allocate
                                       stats, settings, change password
    pages/user/Login.jsx              /user/login (Supabase email+password)
    pages/user/ProfilePreview.jsx     /user/preview, dev-only sample data
  styles.css                 ALL styles (~2.85k lines)
supabase/*.sql               database setup (see below)
public/food/                 photos of the original 11 Meals (~100 KB each)
public/cats/                 home-page slideshow photos (resized)
docs/agents/                 skills config (issue tracker = .scratch/ markdown)
```

**Data model** (terms in `GLOSSARY.md`, decisions in `docs/adr/`):
`meals` = the Menu `{id, title, category, servings, recipe_url, photo_url, ingredients}`;
`planned_meals` `{id, title, meal_id, servings}` = copies of Meals on the list
(ADR-0001; a Meal is planned at most once; not editable once planned);
`list_items` `{id, name, quantity, unit, checked, ever_ticked}` = Shopping list
lines, one per name (any case) + unit. Planning a Meal adds onto matching lines;
after that lines are independent of Planned meals, so removing one leaves its
items (ADR-0003). `ever_ticked` makes "items ticked" count a line once.
Favourites are Meal ids. Everything lives in Supabase, live for both phones.

---

## Supabase (SQL run in this order)

| File | Creates |
|---|---|
| `schema.sql` | `planned_meals`, `grocery_items`, RLS (household = all logged-in users), realtime |
| `profiles.sql` | `profiles` (auto-created per user via trigger), `avatars` storage bucket |
| `profile_stats.sql` | lifetime counters + `bump_my_stats()` RPC |
| `stat_points.sql` | `profiles.stat_points` jsonb |
| `rpg_class.sql` | `profiles.rpg_class` (picked class; null = Vagabond) |
| `chat.sql` | `messages`, `chat_reads`, realtime |
| `meals.sql` | `meals` + seed of the 11 originals, `planned_meals.meal_id/servings`, favourites → ids, `meals_created` stat, `meal-photos` bucket |
| `list_items.sql` | renames `grocery_items` → `list_items`, drops `planned_meal_id`, adds `ever_ticked`, merges duplicate lines |

- Two accounts exist. **Sign-ups are disabled**; add users in
  the dashboard (Authentication → Users → Add user, "Auto Confirm").
- Project created with "auto-grant API access" **off**, so every new table needs
  explicit `grant … to authenticated` + RLS policies (see existing files).
- Logged-out (anon) access to every table/function is denied, verified.
- Stay on free tiers (ADR-0002): photos are resized in the browser and old ones
  deleted when replaced.
- Free plan pauses after ~1 week without use; restore from the dashboard.
- Presence channel `household-presence` drives the online dots; it needs no table.

---

## Design system (user preferences, keep these)

- Modelled on **malaproject.com**: flat saturated page colours, huge extended
  display headline (Archivo 900, wdth 125), Newsreader serif for content,
  Helvetica for UI, small uppercase letter-spaced labels, dotted leaders.
- **Each page has its own colour pair** (`--page-bg` / `--headline`), set via a
  `theme-*` class on both `<html>` and `<body>` (`themeFor()` in RootLayout):
  home red/teal · breakfast yellow/orange · lunch orange/lavender ·
  dinner blue/teal · checkout peach/yellow · user teal/blue ·
  grocery lavender/red.
- **No rounded corners anywhere, ever.** A global
  `border-radius: 0 !important` rule is kept as the **last** rule in
  `styles.css`. Photo ovals are a CSS mask, not radius, and are allowed.
- Purple "ticket" style (white card, `#5a2a82` ruled cells, boxed ✕, big serif
  title) is used by Create meal, Edit profile, and the chat window.
- Profile = RPG character sheet in double-ruled "windows"; party HUD of MMO-style
  frames; Commands menu with ▶ cursor.
- User dislikes: generic "AI-slop" UI (soft shadows, rounded bubbles, gradients),
  over-accenting, and the word **"list-mate"** (use "party"/"party member" or the
  person's name).
- Header fades content scrolling under it; overscroll bounce disabled.
- Hover sounds on nav links (with mute toggle) are intentional; keep them.

---

## Known issues / next steps (prioritised)

1. **Saved meals is live** (deployed 2026-11-27, spec in
   `.scratch/save-custom-meals/`). Still untested by hand: adding a photo to a
   Meal, and live updates between the two phones.
2. **`styles.css` was cleaned 2026-11-27**: dead rules and overridden
   duplicates removed, split sections merged (header fade now lives in the
   Header section). Checked by diffing computed styles of every page (and the
   modals) before/after at 390/1000/1300px: no visual change. Remaining
   repeats are intentional (a shared rule plus a specific override).
   `avatar--*` classes are built in `Avatar.jsx`, so a plain grep shows them as
   unused; they aren't. Keep the no-radius rule last.
3. **Dev tooling audit**: dead code and unused packages were removed
   2026-11-27; `npm audit --omit=dev` is clean. The dev/build tooling
   (webpack, webpack-dev-server and their deps) still reports vulns;
   `npm audit fix` should clear most, then check `npm run dev` / `build`.
   Unused assets still in `public/`: `oldStuff/`, `sniglet webfonts/`,
   `lilguy.jpg`, `myheadshot.png` (nothing references them; keep or delete).
4. Small bugs: untick/re-tick double-counts `items_ticked` (the count comes
   from `toggleGroup` in `lib/list.js`; a real fix needs `bump_my_stats` to
   accept a -1 or a per-item "ever ticked" flag); shared-list
   realtime channel briefly subscribes twice after login; old saved lists may
   still contain "2 small potatoes" / "given up, have we?" items.
5. Features discussed: group shopping list by aisle. (`/menu` was dropped
   2026-11-27; the nav is Breakfast/Lunch/Dinner/Grocery left, the GROCERY
   MENU wordmark links home, List/profile right.)

Issue tracking convention: local markdown in `.scratch/` (see
`docs/agents/issue-tracker.md`).
