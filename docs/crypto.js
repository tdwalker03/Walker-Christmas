// Shared by the browser AND by scripts/draw.js, so the encryption parameters
// can never drift apart between the two sides.
//
// Each person's recipient is encrypted with AES-GCM under a key stretched from
// their own passphrase. The encrypted file is safe to publish: without the
// passphrase the ciphertext is noise, and a wrong passphrase fails the GCM
// authentication tag rather than producing a plausible-looking name.

/**
 * PBKDF2 rounds. Deliberately slow - it costs the family about a second on the
 * reveal (which reads as suspense) but multiplies the cost of grinding through
 * passphrases offline, which matters because the encrypted file is public.
 */
export const PBKDF2_ITERATIONS = 1_000_000;

/**
 * Every name is padded to this many bytes before encryption. AES-GCM
 * ciphertext is the same length as its plaintext, so without padding the file
 * would quietly leak how long each person's recipient's name is - enough to
 * rule names out in a small family.
 */
const PLAINTEXT_BYTES = 64;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** "Copper Sleigh 42" and "copper-sleigh-42" are the same passphrase. */
export function normalisePassphrase(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function deriveKey(passphrase, salt) {
  const base = await crypto.subtle.importKey(
    'raw',
    encoder.encode(normalisePassphrase(passphrase)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function pad(text) {
  const bytes = encoder.encode(text);
  if (bytes.length > PLAINTEXT_BYTES - 1) {
    throw new Error(`"${text}" is too long to encrypt (max ${PLAINTEXT_BYTES - 1} bytes).`);
  }
  const out = new Uint8Array(PLAINTEXT_BYTES);
  out[0] = bytes.length;
  out.set(bytes, 1);
  return out;
}

function unpad(bytes) {
  return decoder.decode(bytes.slice(1, 1 + bytes[0]));
}

const toBase64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromBase64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function encryptName(recipientName, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, pad(recipientName));

  return {
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(ciphertext),
  };
}

/** Returns the recipient's name, or null if the passphrase was wrong. */
export async function decryptName(entry, passphrase) {
  const key = await deriveKey(passphrase, fromBase64(entry.salt));
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(entry.iv) },
      key,
      fromBase64(entry.data),
    );
    return unpad(new Uint8Array(plaintext));
  } catch {
    // GCM authentication failed - wrong passphrase.
    return null;
  }
}
