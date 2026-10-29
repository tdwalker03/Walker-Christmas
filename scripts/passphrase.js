// Passphrase generation: one word, one digit, then ! or $ - like "holly7!".
//
// Built to be read aloud, remembered and typed by anyone in the family. The
// keyspace is deliberately tiny as a result; see the security note in the
// README. DIGITS is the dial if that ever stops being acceptable.

import { WORDS } from './wordlist.js';

export const SYMBOLS = ['!', '$'];

/** Digits in the number. Each extra digit multiplies the keyspace by ten. */
export const DIGITS = 1;

/** What a generated passphrase looks like, after normalisation. */
export const PASSPHRASE_PATTERN = new RegExp(`^[a-z]+[1-9][0-9]{${DIGITS - 1}}[!$]$`);

/** Unbiased pick, avoiding the modulo skew of `% length`. */
function pick(array) {
  const limit = Math.floor(0x100000000 / array.length) * array.length;
  const buf = new Uint32Array(1);
  let n;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return array[n % array.length];
}

export function makePassphrase() {
  // No leading zero, so the number is always exactly DIGITS long and reads
  // naturally when you say it out loud.
  const lowest = 10 ** (DIGITS - 1);
  const numbers = Array.from({ length: 9 * lowest }, (_, i) => lowest + i);
  return `${pick(WORDS)}${pick(numbers)}${pick(SYMBOLS)}`;
}

/** How many passphrases this format can produce. */
export function keyspace() {
  return WORDS.length * 9 * 10 ** (DIGITS - 1) * SYMBOLS.length;
}

/**
 * `count` passphrases that are all different from each other.
 *
 * This matters more than it looks. Each entry stores its own salt, but the key
 * is derived from (passphrase + that entry's salt) - so if two people were
 * handed the SAME passphrase, either of them could select the other's name and
 * open it. With a small keyspace that collision is a real possibility rather
 * than a theoretical one, so it is ruled out here rather than left to luck.
 */
export function makeUniquePassphrases(count) {
  // Keep the draw well clear of the birthday limit; past this the loop below
  // starts thrashing and the format is too small to be handing out anyway.
  if (count * count > keyspace()) {
    throw new Error(
      `Cannot safely generate ${count} distinct passphrases from a keyspace of ${keyspace()}. ` +
        'Raise DIGITS in scripts/passphrase.js or add words to scripts/wordlist.js.',
    );
  }

  const chosen = new Set();
  let guard = 0;
  while (chosen.size < count) {
    chosen.add(makePassphrase());
    if (++guard > count * 1000) throw new Error('Could not find enough distinct passphrases.');
  }
  return [...chosen];
}
