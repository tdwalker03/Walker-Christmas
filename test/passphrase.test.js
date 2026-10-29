import test from 'node:test';
import assert from 'node:assert/strict';

import { makePassphrase, keyspace, PASSPHRASE_PATTERN, SYMBOLS, DIGITS } from '../scripts/passphrase.js';
import { normalisePassphrase, encryptName, decryptName } from '../docs/crypto.js';

test('generated passphrases match the advertised shape', () => {
  for (let i = 0; i < 400; i++) {
    const p = makePassphrase();
    assert.match(p, PASSPHRASE_PATTERN, `"${p}" is not word + ${DIGITS} digits + symbol`);
    assert.ok(SYMBOLS.includes(p.at(-1)), `"${p}" does not end in ! or $`);
    assert.notEqual(p[p.length - DIGITS - 1], '0', `"${p}" has a leading zero in its number`);
  }
});

test('generation is spread across the whole keyspace', () => {
  const sample = Array.from({ length: 600 }, makePassphrase);
  assert.ok(new Set(sample).size > 590, 'passphrases should almost never repeat');

  // Both symbols and a good spread of words should show up.
  assert.equal(new Set(sample.map((p) => p.at(-1))).size, SYMBOLS.length, 'both symbols get used');
  const words = new Set(sample.map((p) => p.match(/^[a-z]+/)[0]));
  assert.ok(words.size > 200, `expected many distinct words, got ${words.size}`);
});

test('keyspace matches what the README claims', () => {
  assert.equal(keyspace(), 478 * 9000 * 2);
  // Guard against a silent weakening - if this drops, the README is wrong.
  assert.ok(Math.log2(keyspace()) > 22, 'keyspace fell below 22 bits');
});

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

test('normalisation forgives case, spaces and hyphens', () => {
  const canonical = 'sleigh4821!';
  for (const variant of ['sleigh4821!', 'Sleigh4821!', 'SLEIGH4821!', 'sleigh 4821 !', '  sleigh-4821-!  ', 'Sleigh 4821!']) {
    assert.equal(normalisePassphrase(variant), canonical, `"${variant}" should normalise to "${canonical}"`);
  }
});

test('normalisation KEEPS the symbol - it is not decoration', () => {
  // Regression: an earlier version stripped ! and $, so "sleigh4821!" and
  // "sleigh4821$" derived the same key and the symbol bought nothing.
  assert.equal(normalisePassphrase('sleigh4821!'), 'sleigh4821!');
  assert.equal(normalisePassphrase('sleigh4821$'), 'sleigh4821$');
  assert.notEqual(normalisePassphrase('sleigh4821!'), normalisePassphrase('sleigh4821$'));
  assert.notEqual(normalisePassphrase('sleigh4821!'), normalisePassphrase('sleigh4821'));
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
  const entry = await encryptName('Dad', 'sleigh4821!');
  for (const typed of ['Sleigh4821!', 'sleigh 4821 !', 'SLEIGH-4821-!']) {
    assert.equal(await decryptName(entry, typed), 'Dad', `"${typed}" should open it`);
  }
});

test('the wrong symbol does not open the entry', async () => {
  const entry = await encryptName('Dad', 'sleigh4821!');
  assert.equal(await decryptName(entry, 'sleigh4821$'), null, 'wrong symbol must fail');
  assert.equal(await decryptName(entry, 'sleigh4821'), null, 'missing symbol must fail');
  assert.equal(await decryptName(entry, 'sleigh4822!'), null, 'wrong number must fail');
  assert.equal(await decryptName(entry, 'slleigh4821!'), null, 'wrong word must fail');
});

test('ciphertext length never reveals the name length', async () => {
  const short = await encryptName('Jo', 'sleigh4821!');
  const long = await encryptName('Great Aunt Henrietta', 'sleigh4821!');
  assert.equal(short.data.length, long.data.length);
});

test('each encryption uses a fresh salt and iv', async () => {
  const a = await encryptName('Dad', 'sleigh4821!');
  const b = await encryptName('Dad', 'sleigh4821!');
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.data, b.data, 'same name and passphrase must not produce identical ciphertext');
});
