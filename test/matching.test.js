import test from 'node:test';
import assert from 'node:assert/strict';
import {
  solve,
  optimalCrossGenderPairs,
  validCandidates,
  drawOne,
  pairCost,
  isAllowed,
  FORBIDDEN,
} from '../src/matching.js';

/** Compact helper: person('a', 'M', 'b') = id "a", male, married to "b". */
function person(id, gender, spouseId = null, excludes = []) {
  return { id, name: id, gender, spouseId, excludes };
}

/** A couple-based family: n men and n women, paired off as spouses. */
function couples(n) {
  const people = [];
  for (let i = 0; i < n; i++) {
    people.push(person(`m${i}`, 'M', `f${i}`));
    people.push(person(`f${i}`, 'F', `m${i}`));
  }
  return people;
}

function assertValidDraw(people, pairs, { allowCross = Infinity } = {}) {
  const byId = new Map(people.map((p) => [p.id, p]));
  assert.equal(pairs.length, people.length, 'everyone gives');
  assert.equal(new Set(pairs.map((p) => p.giverId)).size, people.length, 'each person gives once');
  assert.equal(new Set(pairs.map((p) => p.receiverId)).size, people.length, 'each person receives once');

  let cross = 0;
  for (const { giverId, receiverId } of pairs) {
    const g = byId.get(giverId);
    const r = byId.get(receiverId);
    assert.notEqual(giverId, receiverId, `${giverId} drew themselves`);
    assert.notEqual(g.spouseId, receiverId, `${giverId} drew their spouse`);
    assert.ok(!g.excludes?.includes(receiverId), `${giverId} drew an excluded person`);
    if (g.gender !== 'any' && r.gender !== 'any' && g.gender !== r.gender) cross++;
  }
  assert.ok(cross <= allowCross, `expected at most ${allowCross} cross-gender pairs, got ${cross}`);
  return cross;
}

test('pairCost forbids self, spouse and exclusions in both directions', () => {
  const a = person('a', 'M', 'b', ['c']);
  const b = person('b', 'F', 'a');
  const c = person('c', 'M');
  const d = person('d', 'M');

  assert.equal(pairCost(a, a), FORBIDDEN, 'self');
  assert.equal(pairCost(a, b), FORBIDDEN, 'spouse');
  assert.equal(pairCost(b, a), FORBIDDEN, 'spouse the other way');
  assert.equal(pairCost(a, c), FORBIDDEN, 'explicit exclusion');
  assert.equal(pairCost(a, d), 0, 'same gender, allowed');
  assert.equal(pairCost(b, d), 1, 'cross gender, allowed but penalised');
  assert.equal(isAllowed(b, d), true);
});

test('"any" gender never counts as a cross-gender pair', () => {
  const a = person('a', 'any');
  const b = person('b', 'F');
  assert.equal(pairCost(a, b), 0);
  assert.equal(pairCost(b, a), 0);
});

test('three men and three women, no spouses: everyone matches same-gender', () => {
  const people = [
    person('m0', 'M'), person('m1', 'M'), person('m2', 'M'),
    person('f0', 'F'), person('f1', 'F'), person('f2', 'F'),
  ];
  const result = solve(people);
  assert.ok(result.feasible);
  assert.equal(result.crossGenderPairs, 0);
  assertValidDraw(people, result.pairs, { allowCross: 0 });
});

test('three married couples: same-gender still works despite the spouse rule', () => {
  const people = couples(3);
  const result = solve(people);
  assert.ok(result.feasible);
  assert.equal(result.crossGenderPairs, 0, 'the three men can rotate, so can the three women');
  assertValidDraw(people, result.pairs, { allowCross: 0 });
});

test('a single married couple is impossible', () => {
  const people = couples(1);
  assert.equal(solve(people).feasible, false);
  assert.equal(optimalCrossGenderPairs(people), null);
});

test('two married couples still manage an all-same-gender draw', () => {
  // m0 and m1 swap, f0 and f1 swap. Nobody draws a spouse.
  const people = couples(2);
  const result = solve(people);
  assert.ok(result.feasible);
  assert.equal(result.crossGenderPairs, 0);
  assertValidDraw(people, result.pairs, { allowCross: 0 });
});

test('lone woman among men: exactly two cross-gender pairs are unavoidable', () => {
  // She must give to a man and receive from a man. Two mixed pairs, no fewer.
  const people = [person('m0', 'M'), person('m1', 'M'), person('m2', 'M'), person('f0', 'F')];
  const result = solve(people);
  assert.ok(result.feasible);
  assert.equal(result.crossGenderPairs, 2);
  assertValidDraw(people, result.pairs, { allowCross: 2 });
});

test('a fully excluded person makes the draw infeasible', () => {
  const people = [
    person('a', 'M', null, ['b', 'c']),
    person('b', 'M'),
    person('c', 'M'),
  ];
  assert.equal(solve(people).feasible, false);
});

test('empty and single-person families are handled', () => {
  assert.equal(solve([]).feasible, true);
  assert.equal(solve([person('a', 'M')]).feasible, false);
});

test('drawOne refuses a name that would strand the remaining people', () => {
  // Two couples, optimum is zero cross-gender pairs, so m0's only safe
  // pick is m1 - drawing either woman would blow the target.
  const people = couples(2);
  const target = optimalCrossGenderPairs(people);
  const [m0] = people;
  const options = validCandidates(m0, people, people, 0, target);
  assert.deepEqual(options.map((o) => o.id), ['m1']);
});

// ---------------------------------------------------------------------------
// The important one: simulate the live draw over and over. Whatever order
// people draw in and however the random picks fall, the draw must always
// complete and always respect the rules - nobody can be left stranded.
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function simulateLiveDraw(people, rng) {
  const target = optimalCrossGenderPairs(people);
  assert.notEqual(target, null, 'fixture should be solvable');

  let remainingGivers = [...people];
  let remainingReceivers = [...people];
  let costSoFar = 0;
  const pairs = [];

  // People turn up and draw in whatever order they like.
  for (const giver of shuffled(people, rng)) {
    const pick = drawOne(giver, remainingGivers, remainingReceivers, costSoFar, target, rng);
    assert.notEqual(pick, null, `${giver.id} was left with no legal name`);

    costSoFar += pairCost(giver, pick);
    pairs.push({ giverId: giver.id, receiverId: pick.id });
    remainingGivers = remainingGivers.filter((g) => g.id !== giver.id);
    remainingReceivers = remainingReceivers.filter((r) => r.id !== pick.id);
  }

  assert.equal(remainingReceivers.length, 0, 'every name was taken');
  return { pairs, target };
}

const fixtures = {
  'four couples': couples(4),
  'five couples': couples(5),
  'three couples plus two single men': [
    ...couples(3),
    person('s0', 'M'),
    person('s1', 'M'),
  ],
  'lopsided: five men, two women, one couple': [
    person('m0', 'M', 'f0'), person('f0', 'F', 'm0'),
    person('m1', 'M'), person('m2', 'M'), person('m3', 'M'), person('m4', 'M'),
    person('f1', 'F'),
  ],
  'mixed, with one person marked "any"': [
    ...couples(2),
    person('x0', 'any'),
    person('m9', 'M'),
    person('f9', 'F'),
  ],
  'extended family with exclusions': [
    ...couples(3),
    person('kid0', 'M', null, ['m0', 'f0']),
    person('kid1', 'F', null, ['m0', 'f0']),
  ],
};

for (const [label, people] of Object.entries(fixtures)) {
  test(`live draw always completes legally: ${label}`, () => {
    const target = optimalCrossGenderPairs(people);
    for (let seed = 0; seed < 150; seed++) {
      const { pairs } = simulateLiveDraw(people, mulberry32(seed));
      const cross = assertValidDraw(people, pairs, { allowCross: target });
      assert.equal(cross, target, 'live draw hit the optimal cross-gender count');
    }
  });
}

test('live draw produces varied results across runs', () => {
  const people = couples(4);
  const seen = new Set();
  for (let seed = 0; seed < 60; seed++) {
    const { pairs } = simulateLiveDraw(people, mulberry32(seed));
    seen.add(pairs.map((p) => `${p.giverId}>${p.receiverId}`).sort().join('|'));
  }
  assert.ok(seen.size > 10, `expected many distinct outcomes, got ${seen.size}`);
});
