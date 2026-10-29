// Assignment engine for the family name draw.
//
// Everybody gives to exactly one person and receives from exactly one person,
// so a complete draw is a perfect matching on a bipartite graph of
// givers x receivers. Three rules shape it:
//
//   1. You cannot draw yourself.              (hard)
//   2. You cannot draw your spouse.           (hard)
//   3. Prefer same-gender pairs.              (soft - minimised, not required)
//
// Rule 3 is soft, so we solve a MINIMUM COST perfect matching where a
// cross-gender pair costs 1 and a same-gender pair costs 0. The optimal cost is
// therefore the smallest number of cross-gender pairs the family can possibly
// achieve. If that number is 0, everyone gets a same-gender match.
//
// The live draw never picks greedily. Before handing someone a name we check
// that the rest of the family can still be matched at the same optimal cost, so
// the last person to draw can never be left with only themselves or their
// spouse. See `validCandidates`.

const FORBIDDEN = 1e9;

/**
 * Minimum-cost perfect matching on a square cost matrix (Jonker-Volgenant /
 * Hungarian, O(n^3)). Returns { cost, assignment } where assignment[i] is the
 * column matched to row i.
 */
export function hungarian(cost) {
  const n = cost.length;
  if (n === 0) return { cost: 0, assignment: [] };

  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0); // p[j] = row matched to column j
  const way = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = -1;

      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }

  const assignment = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) {
    if (p[j] > 0) assignment[p[j] - 1] = j - 1;
  }

  let total = 0;
  for (let i = 0; i < n; i++) total += cost[i][assignment[i]];
  return { cost: total, assignment };
}

/**
 * Cost of one giver -> receiver pair.
 *   FORBIDDEN  self, spouse, or an explicit exclusion
 *   1          allowed but cross-gender
 *   0          allowed and same-gender (or gender marked "any")
 *
 * A person whose gender is "any" never incurs the cross-gender penalty, so the
 * rule simply does not apply to them.
 */
export function pairCost(giver, receiver) {
  if (giver.id === receiver.id) return FORBIDDEN;
  if (giver.spouseId != null && giver.spouseId === receiver.id) return FORBIDDEN;
  if (receiver.spouseId != null && receiver.spouseId === giver.id) return FORBIDDEN;
  if (giver.excludes?.includes(receiver.id)) return FORBIDDEN;

  const a = giver.gender;
  const b = receiver.gender;
  if (a === 'any' || b === 'any') return 0;
  return a === b ? 0 : 1;
}

export function isAllowed(giver, receiver) {
  return pairCost(giver, receiver) < FORBIDDEN;
}

function buildCostMatrix(givers, receivers) {
  return givers.map((g) => receivers.map((r) => pairCost(g, r)));
}

/**
 * Solve the whole family at once.
 * Returns { feasible, crossGenderPairs, pairs: [{ giverId, receiverId }] }.
 */
export function solve(people) {
  if (people.length === 0) {
    return { feasible: true, crossGenderPairs: 0, pairs: [] };
  }
  if (people.length === 1) {
    return { feasible: false, crossGenderPairs: 0, pairs: [] };
  }

  const { cost, assignment } = hungarian(buildCostMatrix(people, people));
  if (cost >= FORBIDDEN) {
    return { feasible: false, crossGenderPairs: 0, pairs: [] };
  }

  return {
    feasible: true,
    crossGenderPairs: cost,
    pairs: people.map((g, i) => ({
      giverId: g.id,
      receiverId: people[assignment[i]].id,
    })),
  };
}

/**
 * The smallest number of cross-gender pairs this family can achieve, or null if
 * no valid draw exists at all. This becomes the target the live draw must hold
 * itself to.
 */
export function optimalCrossGenderPairs(people) {
  const result = solve(people);
  return result.feasible ? result.crossGenderPairs : null;
}

/**
 * Minimum additional cost to match everyone in `givers` to everyone in
 * `receivers` (two equal-length lists of people still waiting), or null if
 * impossible.
 */
function remainingCost(givers, receivers) {
  if (givers.length !== receivers.length) return null;
  if (givers.length === 0) return 0;
  const { cost } = hungarian(buildCostMatrix(givers, receivers));
  return cost >= FORBIDDEN ? null : cost;
}

/**
 * Every name `giver` may safely draw right now.
 *
 * A candidate only qualifies if, after taking it, the people who have not yet
 * drawn can still all be matched without breaking a hard rule AND without
 * pushing the total number of cross-gender pairs above `targetCross`. That is
 * what stops the draw from painting itself into a corner.
 *
 * @param giver            the person drawing
 * @param availableGivers  everyone who has not drawn yet, including `giver`
 * @param availableReceivers names not yet taken
 * @param costSoFar        cross-gender pairs among draws already made
 * @param targetCross      the optimal total computed when the draw opened
 */
export function validCandidates(giver, availableGivers, availableReceivers, costSoFar, targetCross) {
  const otherGivers = availableGivers.filter((g) => g.id !== giver.id);
  const valid = [];

  for (const candidate of availableReceivers) {
    const stepCost = pairCost(giver, candidate);
    if (stepCost >= FORBIDDEN) continue;

    const rest = remainingCost(
      otherGivers,
      availableReceivers.filter((r) => r.id !== candidate.id),
    );
    if (rest === null) continue;
    if (costSoFar + stepCost + rest > targetCross) continue;

    valid.push(candidate);
  }

  return valid;
}

/** Uniformly pick one of the safe candidates, or null if there are none. */
export function drawOne(giver, availableGivers, availableReceivers, costSoFar, targetCross, rng = Math.random) {
  const valid = validCandidates(giver, availableGivers, availableReceivers, costSoFar, targetCross);
  if (valid.length === 0) return null;
  return valid[Math.floor(rng() * valid.length)];
}

export { FORBIDDEN };
