// RPG-style character sheet numbers, worked out from what you actually do in
// the app. Tweak the formulas here.
//
//   EXP   10 per meal planned, 15 per meal added to the menu, 2 per item added,
//         1 per item ticked, 5 per favourite
//   LV    level N needs 50·N·(N−1) EXP  (LV2 = 100, LV3 = 300, LV4 = 600 …)
//   HP    max from appetite + level; each thing still to buy drains 3
//   MP    max from cooking + level; each meal still planned drains 4
//   Class picked by you (profiles.rpg_class, Vagabond until you pick); it
//         sets each stat's starting value
//   Stats class base + growth from what you do (see `growth`) + your points
//   Stat points: 5 to start + 3 per level, spent by you (+1 per point).
//   Stored on the profile as stat_points.

const n = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

const expForLevel = (level) => 50 * level * (level - 1);

// Each class sets the starting stats. `level` is the class's starting level,
// shown in the class picker only: LV always comes from EXP.
export const CLASSES = [
  { name: 'Hero', level: 7, stats: { vigor: 14, mind: 9, endurance: 12, strength: 16, dexterity: 9, intelligence: 7, faith: 8, arcane: 11 } },
  { name: 'Bandit', level: 5, stats: { vigor: 10, mind: 11, endurance: 10, strength: 9, dexterity: 13, intelligence: 9, faith: 8, arcane: 14 } },
  { name: 'Astrologer', level: 6, stats: { vigor: 9, mind: 15, endurance: 9, strength: 8, dexterity: 12, intelligence: 16, faith: 7, arcane: 9 } },
  { name: 'Warrior', level: 8, stats: { vigor: 11, mind: 12, endurance: 11, strength: 10, dexterity: 16, intelligence: 10, faith: 8, arcane: 9 } },
  { name: 'Prisoner', level: 9, stats: { vigor: 11, mind: 12, endurance: 11, strength: 11, dexterity: 14, intelligence: 14, faith: 6, arcane: 9 } },
  { name: 'Confessor', level: 10, stats: { vigor: 10, mind: 13, endurance: 10, strength: 12, dexterity: 12, intelligence: 9, faith: 14, arcane: 9 } },
  { name: 'Wretch', level: 1, stats: { vigor: 10, mind: 10, endurance: 10, strength: 10, dexterity: 10, intelligence: 10, faith: 10, arcane: 10 } },
  { name: 'Vagabond', level: 9, stats: { vigor: 15, mind: 10, endurance: 11, strength: 14, dexterity: 13, intelligence: 9, faith: 9, arcane: 7 } },
  { name: 'Prophet', level: 7, stats: { vigor: 10, mind: 14, endurance: 8, strength: 11, dexterity: 10, intelligence: 7, faith: 16, arcane: 10 } },
  { name: 'Samurai', level: 9, stats: { vigor: 12, mind: 11, endurance: 13, strength: 12, dexterity: 15, intelligence: 9, faith: 8, arcane: 8 } },
];

export const DEFAULT_CLASS = 'Vagabond';

// Unknown or unset classes fall back to the default.
export const classFor = (name) =>
  CLASSES.find((c) => c.name === name) || CLASSES.find((c) => c.name === DEFAULT_CLASS);

const STATS = [
  { key: 'vigor', label: 'Vigor' },
  { key: 'mind', label: 'Mind' },
  { key: 'endurance', label: 'Endurance' },
  { key: 'strength', label: 'Strength' },
  { key: 'dexterity', label: 'Dexterity' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'faith', label: 'Faith' },
  { key: 'arcane', label: 'Arcane' },
];

export const STAT_KEYS = STATS.map((s) => s.key);

export const pointsEarned = (level) => 5 + (level - 1) * 3;

// Only keep known stats with whole, non-negative numbers.
export const cleanPoints = (raw) => {
  const out = {};
  STAT_KEYS.forEach((key) => {
    const v = Math.floor(n(raw?.[key]));
    if (v > 0) out[key] = v;
  });
  return out;
};

export const pointsSpent = (points) =>
  Object.values(cleanPoints(points)).reduce((sum, v) => sum + v, 0);

// `pointsOverride` / `classOverride` let the allocate screen preview unsaved changes.
export const rpgStats = (
  profile,
  { toBuy = 0, mealsPlanned = 0, pointsOverride, classOverride } = {}
) => {
  const cook = n(profile.cook_willingness, 5);
  const eat = n(profile.eat_willingness, 5);
  const meals = n(profile.meals_planned);
  const added = n(profile.items_added);
  const ticked = n(profile.items_ticked);
  const created = n(profile.meals_created);
  const favs = profile.favorites?.length || 0;

  const exp = meals * 10 + created * 15 + added * 2 + ticked + favs * 5;
  let level = 1;
  while (exp >= expForLevel(level + 1)) level += 1;
  const nextLevelIn = expForLevel(level + 1) - exp;

  const points = cleanPoints(pointsOverride ?? profile.stat_points);
  const rpgClass = classFor(classOverride ?? profile.rpg_class);

  // What you've done in the app grows each stat on top of the class's base.
  const growth = {
    vigor: eat,
    mind: cook,
    endurance: Math.floor(ticked / 5),
    strength: Math.floor(added / 5),
    dexterity: Math.floor(meals / 2),
    intelligence: created,
    faith: favs,
    arcane: level - 1,
  };

  const hpMax = 40 + eat * 8 + level * 5;
  const mpMax = 20 + cook * 6 + level * 3;

  return {
    className: rpgClass.name,
    level,
    exp,
    nextLevelIn,
    hp: Math.max(1, hpMax - toBuy * 3),
    hpMax,
    mp: Math.max(0, mpMax - mealsPlanned * 4),
    mpMax,
    pointsEarned: pointsEarned(level),
    pointsSpent: Math.min(pointsSpent(points), pointsEarned(level)),
    pointsLeft: Math.max(0, pointsEarned(level) - pointsSpent(points)),
    stats: STATS.map((stat) => {
      const base = rpgClass.stats[stat.key] + growth[stat.key];
      const bonus = points[stat.key] || 0;
      const total = base + bonus;
      return { ...stat, base, bonus, total, value: `${total}` };
    }),
  };
};
