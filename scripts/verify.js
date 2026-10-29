// Proves the published draw is correct, from the outside.
//
//   npm run verify
//
// Decrypts docs/assignments.json using passphrases.txt - exactly as each family
// member's browser will - and re-checks every rule against family.json. Run it
// before you hand the passphrases out.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decryptName } from '../docs/crypto.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`\n  ✖ ${message}\n`);
  process.exit(1);
}

function read(file, label) {
  try {
    return readFileSync(join(ROOT, file), 'utf8');
  } catch {
    fail(`Could not read ${file}. ${label}`);
  }
}

const family = JSON.parse(read('family.json', 'Run `npm run draw` first.'));
const published = JSON.parse(read('docs/assignments.json', 'Run `npm run draw` first.'));
const passphraseText = read('passphrases.txt', 'Run `npm run draw` first.');

// passphrases.txt is "  Name   word1234!" per line.
const passphrases = new Map();
for (const line of passphraseText.split('\n')) {
  const match = line.match(/^\s{2}(.+?)\s{2,}([a-z0-9!$-]+)\s*$/);
  if (match) passphrases.set(match[1].trim(), match[2]);
}

const people = new Map(family.people.map((p) => [String(p.name).trim(), p]));

// --- the published file must not contain anything readable -------------------

const published_raw = read('docs/assignments.json', '');
for (const name of people.keys()) {
  const occurrences = published_raw.split(`"${name}"`).length - 1;
  if (occurrences !== 1) {
    fail(`"${name}" appears ${occurrences} times in assignments.json - it should appear exactly once, as a giver.`);
  }
}

const lengths = new Set(published.entries.map((e) => e.data.length));
if (lengths.size !== 1) {
  fail(`Ciphertexts have ${lengths.size} different lengths - that leaks how long each recipient's name is.`);
}

// --- decrypt everything ------------------------------------------------------

const assignments = new Map();
for (const entry of published.entries) {
  const passphrase = passphrases.get(entry.name);
  if (!passphrase) fail(`No passphrase found for ${entry.name} in passphrases.txt.`);

  const recipient = await decryptName(entry, passphrase);
  if (recipient === null) fail(`${entry.name}'s passphrase does not decrypt their entry.`);
  assignments.set(entry.name, recipient);
}

// --- re-check every rule -----------------------------------------------------

const problems = [];

if (assignments.size !== people.size) {
  problems.push(`${assignments.size} entries published but ${people.size} people in family.json.`);
}

const received = [...assignments.values()];
for (const [giver, recipient] of assignments) {
  const person = people.get(giver);
  if (!person) problems.push(`${giver} is published but not in family.json.`);
  if (!people.has(recipient)) problems.push(`${giver} draws "${recipient}", who is not in family.json.`);
  if (giver === recipient) problems.push(`${giver} drew themselves.`);
  if (person?.spouse && String(person.spouse).trim() === recipient) problems.push(`${giver} drew their spouse.`);
  if ((person?.excludes ?? []).map((e) => String(e).trim()).includes(recipient)) {
    problems.push(`${giver} drew ${recipient}, who is on their exclusion list.`);
  }
  if (received.filter((r) => r === recipient).length !== 1) {
    problems.push(`${recipient} is drawn by more than one person.`);
  }
}

for (const name of people.keys()) {
  if (!received.includes(name)) problems.push(`Nobody is buying for ${name}.`);
}

if (problems.length) {
  console.error('\n  ✖ The published draw is NOT valid:\n');
  for (const p of [...new Set(problems)]) console.error(`      - ${p}`);
  console.error('');
  process.exit(1);
}

const mixed = [...assignments].filter(([g, r]) => {
  const a = people.get(g)?.gender ?? 'any';
  const b = people.get(r)?.gender ?? 'any';
  return a !== 'any' && b !== 'any' && a !== b;
});

console.log(`\n  ✔ Verified ${assignments.size} assignments by decrypting the published file.\n`);
console.log('      - everyone gives once and receives once');
console.log('      - nobody drew themselves');
console.log('      - nobody drew their spouse');
console.log('      - every exclusion was respected');
console.log(
  mixed.length === 0
    ? '      - every pair is same-gender'
    : `      - ${mixed.length} mixed-gender ${mixed.length === 1 ? 'pair' : 'pairs'} (the minimum for this family)`,
);
console.log('      - no plaintext recipient names in the published file');
console.log('      - all ciphertexts the same length\n');
