// Passphrase generation: one word, a number, then ! or $ - like "sleigh4821!".
//
// Short enough to text to a grandparent and type on a phone. The security
// trade-off that comes with that is spelled out in the README; the short
// version is that this format is far weaker than a multi-word passphrase, and
// DIGITS is the dial to turn if you want more.

import { WORDS } from './wordlist.js';

export const SYMBOLS = ['!', '$'];

/** Digits in the number. Each extra digit multiplies the work to guess by 10. */
export const DIGITS = 4;

/** What a generated passphrase looks like, after normalisation. */
export const PASSPHRASE_PATTERN = new RegExp(`^[a-z]+[0-9]{${DIGITS}}[!$]$`);

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
