// Runs ONCE, on your own machine, to generate the draw.
//
//   npm run draw
//
// It reads family.json, works out a valid assignment, and writes two files:
//
//   docs/assignments.json  encrypted - safe to commit to a public repo
//   passphrases.txt        PLAIN TEXT - gitignored, never commit this
//
// Everybody's result is sealed with their own passphrase, so the published
// file gives nothing away. You hand each person their passphrase privately.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { solve } from '../src/matching.js';
import { encryptName } from '../docs/crypto.js';
import { makeUniquePassphrases } from './passphrase.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAMILY_FILE = join(ROOT, 'family.json');
const OUT_FILE = join(ROOT, 'docs', 'assignments.json');
const PASSPHRASE_FILE = join(ROOT, 'passphrases.txt');
// Pages serves JS with max-age=600, so these carry a ?v= token that is
// rewritten on every draw. Without it a browser can pair a cached crypto.js
// with a fresh draw and reject every correct passphrase.
const VERSIONED_FILES = [join(ROOT, 'docs', 'index.html'), join(ROOT, 'docs', 'app.js')];

function fail(message) {
  console.error(`\n  ✖ ${message}\n`);
  process.exit(1);
}

// --- read and validate the roster -------------------------------------------

let config;
try {
  config = JSON.parse(readFileSync(FAMILY_FILE, 'utf8'));
} catch (err) {
  if (err.code === 'ENOENT') {
    fail('No family.json found. Copy family.example.json to family.json and fill it in.');
  }
  fail(`family.json is not valid JSON: ${err.message}`);
}

const roster = config.people;
if (!Array.isArray(roster) || roster.length < 3) {
  fail('family.json needs a "people" array with at least three people in it.');
}

const names = roster.map((p) => String(p.name ?? '').trim());
names.forEach((n, i) => {
  if (!n) fail(`Person #${i + 1} in family.json has no name.`);
});

const duplicates = names.filter((n, i) => names.findIndex((m) => m.toLowerCase() === n.toLowerCase()) !== i);
if (duplicates.length) {
  fail(`Two people share a name: ${[...new Set(duplicates)].join(', ')}. Names must be unique - add an initial.`);
}

const indexOf = (name, context) => {
  const i = names.findIndex((n) => n.toLowerCase() === String(name).trim().toLowerCase());
  if (i === -1) fail(`${context} refers to "${name}", who is not in family.json.`);
  return i;
};

// The matching engine works in ids; here the id is simply the array index.
const people = roster.map((p, i) => {
  const gender = p.gender ?? 'any';
  if (!['M', 'F', 'any'].includes(gender)) {
    fail(`${names[i]} has gender "${gender}". Use "M", "F" or "any".`);
  }
  return {
    id: i,
    name: names[i],
    gender,
    spouseId: p.spouse ? indexOf(p.spouse, `${names[i]}'s spouse`) : null,
    excludes: (p.excludes ?? []).map((e) => indexOf(e, `${names[i]}'s exclusions`)),
  };
});

// A one-sided spouse link would quietly let somebody draw their partner.
for (const p of people) {
  if (p.spouseId == null) continue;
  const partner = people[p.spouseId];
  if (partner.spouseId !== p.id) {
    fail(
      `Spouse links do not match up: ${p.name} is married to ${partner.name}, ` +
        `but ${partner.name} is ${partner.spouseId == null ? 'not married to anyone' : `married to ${people[partner.spouseId].name}`}. ` +
        'Set it on both people.',
    );
  }
  if (p.spouseId === p.id) fail(`${p.name} is listed as their own spouse.`);
}

// --- work out the assignment ------------------------------------------------

const result = solve(people);
if (!result.feasible) {
  fail(
    'No valid draw is possible with these rules - somebody would always be left with ' +
      'themselves or their spouse. Check the spouse links and exclusions in family.json.',
  );
}

// --- build the published file ----------------------------------------------

const recipientOf = new Map(result.pairs.map((p) => [p.giverId, p.receiverId]));
const entries = [];

// Distinct passphrases: two people sharing one could open each other's name.
let issued;
try {
  issued = makeUniquePassphrases(people.length);
} catch (err) {
  fail(err.message);
}

const passphrases = new Map(people.map((p, i) => [p.name, issued[i]]));

for (const person of people) {
  entries.push({
    name: person.name,
    ...(await encryptName(
      people[recipientOf.get(person.id)].name,
      passphrases.get(person.name),
    )),
  });
}

// Published in name order - the order must not hint at who drew whom.
entries.sort((a, b) => a.name.localeCompare(b.name));

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(
  OUT_FILE,
  `${JSON.stringify(
    {
      generated: new Date().toISOString(),
      note: 'Each entry is AES-GCM encrypted with that person\'s own passphrase. Safe to publish.',
      entries,
    },
    null,
    2,
  )}\n`,
);

const lines = [
  'KEEP THIS FILE PRIVATE. It is gitignored - do not commit it.',
  '',
  `Generated ${new Date().toLocaleString()}`,
  'Send each person their own line, and only their own line.',
  '',
  ...people
    .map((p) => `  ${p.name.padEnd(Math.max(...people.map((q) => q.name.length)) + 2)}${passphrases.get(p.name)}`)
    .sort(),
  '',
];
writeFileSync(PASSPHRASE_FILE, `${lines.join('\n')}\n`);

// --- bust the browser cache -------------------------------------------------

const version = Date.now().toString(36);
for (const file of VERSIONED_FILES) {
  const src = readFileSync(file, 'utf8');
  const stamped = src.replace(/(\?v=)[A-Za-z0-9]+/g, `$1${version}`);
  if (stamped !== src) writeFileSync(file, stamped);
}

// --- report -----------------------------------------------------------------

console.log(`\n  🎄 Drew ${people.length} names.\n`);
if (result.crossGenderPairs === 0) {
  console.log('     Everyone was matched with someone of the same gender.');
} else {
  const n = result.crossGenderPairs;
  console.log(`     ${n} ${n === 1 ? 'pair is' : 'pairs are'} mixed-gender - the fewest this family allows.`);
}
console.log(`\n     Published  docs/assignments.json   (encrypted, safe to commit)`);
console.log(`     Private    passphrases.txt          (gitignored - hand these out yourself)\n`);
console.log('     Re-running this command reshuffles everything and invalidates');
console.log('     every passphrase you have already given out.\n');
