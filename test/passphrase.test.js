import test from 'node:test';
import assert from 'node:assert/strict';

import {
  makePassphrase, makeUniquePassphrases, keyspace,
  PASSPHRASE_PATTERN, SYMBOLS, DIGITS,
} from '../scripts/passphrase.js';
import { WORDS } from '../scripts/wordlist.js';
import { normalisePassphrase, encryptName, decryptName } from '../docs/crypto.js';

test('generated passphrases match the advertised shape', () => {
  for (let i = 0; i < 400; i++) {
    const p = makePassphrase();
    assert.match(p, PASSPHRASE_PATTERN, `"${p}" is not word + ${DIGITS} digits + symbol`);
    assert.ok(SYMBOLS.includes(p.at(-1)), `"${p}" does not end in ! or $`);
    assert.notEqual(p[p.length - DIGITS - 1], '0', `"${p}" has a leading zero in its number`);
  }
});

test('generation draws on the whole word list and both symbols', () => {
  const sample = Array.from({ length: 3000 }, makePassphrase);
  assert.equal(new Set(sample.map((p) => p.at(-1))).size, SYMBOLS.length, 'both symbols get used');

  const words = new Set(sample.map((p) => p.match(/^[a-z]+/)[0]));
  assert.ok(words.size > WORDS.length * 0.9, `expected most of the ${WORDS.length} words, got ${words.size}`);

  const digits = new Set(sample.map((p) => p.match(/[0-9]+/)[0]));
  assert.equal(digits.size, 9, 'digits 1-9 all appear, and never 0');
});

test('keyspace matches what the README claims', () => {
  assert.equal(keyspace(), WORDS.length * 9 * 2);
});

// ---------------------------------------------------------------------------
// With a keyspace this small, two people drawing the same passphrase is a real
// possibility - and a leak, because either could then open the other's name.
// ---------------------------------------------------------------------------

test('a batch of passphrases is always collision-free', () => {
  for (let run = 0; run < 200; run++) {
    const batch = makeUniquePassphrases(13);
    assert.equal(batch.length, 13);
    assert.equal(new Set(batch).size, 13, 'batch contained a duplicate');
  }
});

test('duplicates really would be possible without that guard', () => {
  // Confirms the guard is earning its place rather than guarding nothing:
  // naive generation collides often enough at this keyspace to matter.
  let collided = 0;
  for (let run = 0; run < 200; run++) {
    const naive = Array.from({ length: 13 }, makePassphrase);
    if (new Set(naive).size !== 13) collided++;
  }
  assert.ok(collided > 0, 'expected naive generation to collide at least once in 200 draws');
});

test('refuses to generate more passphrases than the format can safely hold', () => {
  assert.throws(() => makeUniquePassphrases(keyspace()), /Raise DIGITS|distinct passphrases/);
});

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

test('normalisation forgives case, spaces and hyphens', () => {
  const canonical = 'holly7!';
  for (const variant of ['holly7!', 'Holly7!', 'HOLLY7!', 'holly 7 !', '  holly-7-!  ', 'Holly 7!']) {
    assert.equal(normalisePassphrase(variant), canonical, `"${variant}" should normalise to "${canonical}"`);
  }
});

test('normalisation KEEPS the symbol - it is not decoration', () => {
  // Regression: an earlier version stripped ! and $, so "holly7!" and
  // "sleigh4821$" derived the same key and the symbol bought nothing.
  assert.equal(normalisePassphrase('holly7!'), 'holly7!');
  assert.equal(normalisePassphrase('holly7$'), 'holly7$');
  assert.notEqual(normalisePassphrase('holly7!'), normalisePassphrase('holly7$'));
  assert.notEqual(normalisePassphrase('holly7!'), normalisePassphrase('holly7'));
});

// ---------------------------------------------------------------------------
// Round trip through the real encryption
// ---------------------------------------------------------------------------

test('a name encrypts and decrypts with its own passphrase', async () => {
  const passphrase = makePassphrase();
  const entry = await encryptName('Grandma Jean', passphrase);
  assert.equal(await decryptName(entry, passphrase), 'Grandma Jean');
});

test('sloppily typed passphrases still work', async () => {
  const entry = await encryptName('Dad', 'holly7!');
  for (const typed of ['Holly7!', 'holly 7 !', 'HOLLY-7-!']) {
    assert.equal(await decryptName(entry, typed), 'Dad', `"${typed}" should open it`);
  }
});

test('the wrong symbol does not open the entry', async () => {
  const entry = await encryptName('Dad', 'holly7!');
  assert.equal(await decryptName(entry, 'holly7$'), null, 'wrong symbol must fail');
  assert.equal(await decryptName(entry, 'holly7'), null, 'missing symbol must fail');
  assert.equal(await decryptName(entry, 'holly8!'), null, 'wrong number must fail');
  assert.equal(await decryptName(entry, 'hollly7!'), null, 'wrong word must fail');
});

test('ciphertext length never reveals the name length', async () => {
  const short = await encryptName('Jo', 'holly7!');
  const long = await encryptName('Great Aunt Henrietta', 'holly7!');
  assert.equal(short.data.length, long.data.length);
});

test('each encryption uses a fresh salt and iv', async () => {
  const a = await encryptName('Dad', 'holly7!');
  const b = await encryptName('Dad', 'holly7!');
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.data, b.data, 'same name and passphrase must not produce identical ciphertext');
});
