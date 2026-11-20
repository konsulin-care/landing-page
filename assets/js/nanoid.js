/** Unambiguous 32-char alphabet: digits 2-9 and A-Z without I and O. */
export const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Returns a random Nano ID drawn from ALPHABET. 32 divides 256, so `byte & 31` is unbiased.
 * @param {number} [size=10] number of characters
 * @param {(n: number) => Uint8Array} [random] byte source, injectable for tests
 * @returns {string} random id of length size
 */
export function nanoId(
  size = 10,
  random = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n)),
) {
  const bytes = random(size);
  let id = '';
  for (let k = 0; k < size; k += 1) id += ALPHABET[bytes[k] & 31];
  return id;
}
