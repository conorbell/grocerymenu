// RPG-style character sheet numbers, worked out from what you actually do in
// the app. Tweak the formulas here.
//
//   EXP   10 per meal planned, 2 per item added, 1 per item ticked, 5 per favourite
//   LV    level N needs 50·N·(N−1) EXP  (LV2 = 100, LV3 = 300, LV4 = 600 …)
//   HP    max from appetite + level; each thing still to buy drains 3
//   MP    max from cooking + level; each meal still planned drains 4
//   Stat points: 5 to start + 3 per level, spent by you (+1 per point, or
//   +1% for Evasion / Magic Evasion). Stored on the profile as stat_points.

const n = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

const expForLevel = (level) => 50 * level * (level - 1);

export const STAT_KEYS = [
  'strength',
  'speed',
  'stamina',
  'magic',
  'attack',
  'defense',
  'evasion',
  'magic_defense',
  'magic_evasion',
];

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

export const characterClass = (cook, eat) => {
  if (cook >= 8 && eat >= 8) return 'Feast Paladin';
  if (cook >= 8) return 'Kitchen Mage';
  if (eat >= 8) return 'Snack Berserker';
  if (cook <= 2 && eat <= 2) return 'Wandering Ascetic';
  if (cook <= 2) return 'Takeout Rogue';
  if (eat <= 2) return 'Picky Bard';
  return 'Pantry Squire';
};

// `pointsOverride` lets the allocate screen preview unsaved changes.
export const rpgStats = (profile, { toBuy = 0, mealsPlanned = 0, pointsOverride } = {}) => {
  const cook = n(profile.cook_willingness, 5);
  const eat = n(profile.eat_willingness, 5);
  const meals = n(profile.meals_planned);
  const added = n(profile.items_added);
  const ticked = n(profile.items_ticked);
  const favs = profile.favorites?.length || 0;

  const exp = meals * 10 + added * 2 + ticked + favs * 5;
  let level = 1;
  while (exp >= expForLevel(level + 1)) level += 1;
  const nextLevelIn = expForLevel(level + 1) - exp;

  const points = cleanPoints(pointsOverride ?? profile.stat_points);

  const hpMax = 40 + eat * 8 + level * 5;
  const mpMax = 20 + cook * 6 + level * 3;

  return {
    className: characterClass(cook, eat),
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
    stats: [
      { key: 'strength', label: 'Strength', base: 10 + ticked },
      { key: 'speed', label: 'Speed', base: 10 + meals },
      { key: 'stamina', label: 'Stamina', base: 10 + eat * 5 },
      { key: 'magic', label: 'Magic', base: 10 + cook * 5 },
      { key: 'attack', label: 'Attack', base: 10 + added },
      { key: 'defense', label: 'Defense', base: 10 + favs * 3 },
      { key: 'evasion', label: 'Evasion', base: (10 - cook) * 8, suffix: '%' },
      { key: 'magic_defense', label: 'Magic Defense', base: 10 + eat * 4 + level },
      { key: 'magic_evasion', label: 'Magic Evasion', base: (10 - eat) * 5, suffix: '%' },
    ].map((stat) => {
      const bonus = points[stat.key] || 0;
      const total = stat.base + bonus;
      return {
        ...stat,
        suffix: stat.suffix || '',
        bonus,
        total,
        value: `${total}${stat.suffix || ''}`,
      };
    }),
  };
};
