import { rpgStats, classFor, CLASSES, DEFAULT_CLASS } from './rpgStats';

const stat = (rpg, key) => rpg.stats.find((s) => s.key === key);

test('unpicked or unknown class falls back to Vagabond', () => {
  expect(DEFAULT_CLASS).toBe('Vagabond');
  expect(rpgStats({}).className).toBe('Vagabond');
  expect(classFor('Snack Berserker').name).toBe('Vagabond');
});

test('picked class sets the base stats; level stays EXP-only', () => {
  const fresh = { cook_willingness: 0, eat_willingness: 0 };
  const hero = rpgStats({ ...fresh, rpg_class: 'Hero' });
  const wretch = rpgStats({ ...fresh, rpg_class: 'Wretch' });
  expect(stat(hero, 'strength').base).toBe(16);
  expect(stat(wretch, 'strength').base).toBe(10);
  expect(hero.level).toBe(1);
  expect(wretch.level).toBe(1);
});

test('class override previews an unsaved pick', () => {
  expect(rpgStats({ rpg_class: 'Hero' }, { classOverride: 'Samurai' }).className).toBe('Samurai');
});

test('allocated points add on top; old stat names are dropped and refunded', () => {
  const rpg = rpgStats({ rpg_class: 'Wretch', stat_points: { strength: 2, magic: 3 } });
  expect(stat(rpg, 'strength').bonus).toBe(2);
  expect(stat(rpg, 'strength').total).toBe(stat(rpg, 'strength').base + 2);
  expect(rpg.pointsLeft).toBe(rpg.pointsEarned - 2);
});

test('every class has all eight stats', () => {
  CLASSES.forEach((c) => expect(Object.keys(c.stats)).toHaveLength(8));
});
