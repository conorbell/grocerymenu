# Handoff: Grocery Menu ("Forks Ready")

_Last updated: 2026-11-27. Read this first when picking the project back up._

A shared meal-planner + grocery list for a two-person household (Conor and his
fiancée Melissa). Pick meals from a menu, their ingredients land on a shared
shopping list that both phones see live. Also has RPG-style profiles, a party
HUD, and a household chat.

- **Live:** https://grocerymenu-lyart.vercel.app (Vercel project `grocerymenu`)
- **Backend:** Supabase (auth, Postgres, Realtime, Storage)
- **Frontend:** React 18 + React Router 6, bundled with webpack (no framework)

---

## ⚠️ Read before touching git

- **Nothing from this work is committed.** ~48 changed/new paths are uncommitted
  in this folder. The only other copy is the deployed Vercel build.
- **Local `main` is 25 commits behind GitHub `main`**, and GitHub `main` is a
  *different app* (a Next.js + Supabase rewrite from June 2024). Do **not** push
  this to `main` or pull `main` over it.
- Recommended: commit everything to a new branch (e.g. `forks-ready`) and push
  that branch only. Decide later which version becomes `main`.
- `dist/` is a build output and is currently untracked; add it to `.gitignore`
  before committing.
- Vercel's GitHub integration was **disconnected on purpose** so pushes to
  GitHub `main` can't overwrite the live site. Deploy from this folder (below).

---

## Running it

```bash
npm install
npm run dev        # webpack dev server :8080 + Express :3333 (meals API)
```

- Needs `.env` (gitignored) with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
  (publishable key, safe in the browser; RLS protects data). See `.env.example`.
  `MONGO_URI` is legacy and points at a dead cluster; the server falls back to
  `server/data/meals.json`.
- `webpack.config.js` bakes the Supabase env vars in via `DefinePlugin`, so
  **restart `npm run dev` after editing `.env`**.
- Without Supabase keys the app still works, with lists saved in the browser only.
- Only one `npm run dev` at a time (ports 8080/3333).

**Deploy:** `vercel deploy --prod` from the repo root (CLI is logged in). Vercel
builds `npm run build` → `dist/`, serves meals from `api/[category].js`
(reads `server/data/meals.json`), and rewrites every non-`/api` path to
`index.html`. Supabase env vars are set in the Vercel project (Production).

**Dev-only preview:** `/user/preview` shows the profile, party HUD, settings,
stat allocation and a chat demo with sample data, no login needed. Stripped
from production builds.

---

## Architecture

```
src/
  Routes.jsx                 routes; App = ListProvider > ChatProvider > Router
  layouts/RootLayout.jsx     header nav, per-page theme, corner pills, chat
  lib/
    supabase.js              client (null when not configured)
    rpgStats.js              LV/EXP/HP/MP/class/stats + stat points (tweak here)
    ingredients.js           recipe ingredient = "egg" or {name,quantity,unit}
    shareList.js             "Share list" text + share sheet / copy fallback
    useAllMeals.js           loads breakfast/lunch/dinner together
    image.js                 resize/crop photos before upload
    units.js                 unit dropdown values
  components/
    functions/ListContextWrapper.js   THE store: meals, items, auth, profiles,
                                       favourites, stats, presence (big file)
    functions/ChatContext.js          chat: load-by-day, realtime, typing, reads
    ChatPanel.jsx, CreateMeal.jsx, Avatar.jsx, HeartIcon.jsx
    main.js                           Home (cat photo slideshow)
    pages/Grocery.jsx                 /grocery – every known item, tick to add/remove
    pages/FullMenu.jsx                /menu – whole menu, read-only
    pages/menus/MealMenu.jsx          /breakfast /lunch /dinner (add, favourite)
    pages/menus/Checkout.jsx          /checkout – shared list, add extra items,
                                       tick off, Share list
    pages/user/Account.jsx            /user – character sheet, party HUD,
                                       edit profile (+ photo crop), allocate
                                       stats, settings, change password
    pages/user/Login.jsx              /user/login (Supabase email+password)
  styles.css                 ALL styles (~2.8k lines, see "Known issues")
api/[category].js            Vercel serverless meals API
server/                      local Express stand-in for the meals API (+ legacy)
supabase/*.sql               database setup (all already run, see below)
public/food/                 menu photos (very heavy, see "Known issues")
public/cats/                 home-page slideshow photos (resized)
docs/agents/                 skills config (issue tracker = .scratch/ markdown)
```

**List data model** (same locally and in Supabase):
`meals: [{id, title}]`, `items: [{id, name, quantity, unit, checked, planned_meal_id}]`.
`planned_meal_id = null` → standalone "extra" item. Removing a meal removes its
items (FK cascade). Checkout groups items by name+unit and sums quantities.
Logged out → localStorage (`grocerymenu:lists:v2`); logged in → Supabase + live.

---

## Supabase (all SQL already run, in this order)

| File | Creates |
|---|---|
| `schema.sql` | `planned_meals`, `grocery_items`, RLS (household = all logged-in users), realtime |
| `profiles.sql` | `profiles` (auto-created per user via trigger), `avatars` storage bucket |
| `profile_stats.sql` | lifetime counters + `bump_my_stats()` RPC |
| `stat_points.sql` | `profiles.stat_points` jsonb |
| `chat.sql` | `messages`, `chat_reads`, realtime |

- Two accounts exist (Conor and Melissa). **Sign-ups are disabled**; add users in
  the dashboard (Authentication → Users → Add user, "Auto Confirm").
- Project created with "auto-grant API access" **off**, so every new table needs
  explicit `grant … to authenticated` + RLS policies (see existing files).
- Logged-out (anon) access to every table/function is denied, verified.
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
  grocery lavender/red · menu blue/yellow.
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

1. **Back up the code** (see git section above).
2. **Shrink `public/food`** (19 MB; single PNGs up to 5.8 MB). Resize to ~800px
   JPEG like `public/cats/`; update `img` paths in `meals.json`.
3. **Clean up `styles.css`**: many sections are defined twice (later override
   wins: `.profile`, `.site-header`, `.party__frames`, nav labels…). Merge,
   delete dead styles (old chat/ticket variants). Keep the no-radius rule last.
4. **Remove dead code/deps**: `saveMeals.js`, `saveGroceries.js`, `OldLists.jsx`,
   empty `new.css`, commented `userContext.js`, Express login/cookie routes,
   Mongo; unused packages (mongoose, mongodb, db-conn, react-player,
   react-audio-player, react-style-tag, node-fetch, url-loader,
   assets-webpack-plugin, webpack-hot-middleware, path). `npm audit` reports 7
   vulns (1 critical) in prod deps. The only test (`Breakfast.test.js`) is a
   broken placeholder.
5. Small bugs: untick/re-tick double-counts `items_ticked`; chat unread badge
   only counts the loaded (last 3) days; shared-list realtime channel briefly
   subscribes twice after login; old saved lists may still contain
   "2 small potatoes" / "given up, have we?" items.
6. Features discussed: **save custom meals to the menu** (Supabase `meals`
   table, optional photo using the avatar upload pipeline, then retire Express +
   `meals.json`); group shopping list by aisle.

Issue tracking convention: local markdown in `.scratch/` (see
`docs/agents/issue-tracker.md`). Good next command: `/to-spec save custom meals
to the menu`.
