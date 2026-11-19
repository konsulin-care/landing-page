import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALPHABET, nanoId } from '../assets/js/nanoid.js';

test('nanoId(10) returns 10 characters from the 32-char alphabet', () => {
  assert.equal(ALPHABET, '23456789ABCDEFGHJKLMNPQRSTUVWXYZ');
  assert.equal(ALPHABET.length, 32);
  assert.ok(!/[01IO]/.test(ALPHABET));

  const id = nanoId(10);
  assert.equal(id.length, 10);
  for (const char of id) assert.ok(ALPHABET.includes(char), `unexpected char ${char}`);
});

test('nanoId maps each injected byte to ALPHABET[byte & 31]', () => {
  const id = nanoId(4, () => new Uint8Array([0, 31, 32, 255]));
  assert.equal(id, '2Z2Z');
});

test('two consecutive default nanoId() calls return different values', () => {
  assert.notEqual(nanoId(), nanoId());
});
