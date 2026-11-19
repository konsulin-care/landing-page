import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REST_COLOR,
  PEAK_COLOR,
  createField,
  pointerRadius,
  step,
  isSettled,
  displacementRatio,
  dotColor,
} from '../assets/js/resilience-physics.js';

/** Builds a small field whose centre is easy to reason about. */
function makeField() {
  return createField(11, 6, 440, 240);
}

test('createField lays out a centred, still grid', () => {
  const field = makeField();
  assert.equal(field.dots.length, 11 * 6);
  assert.equal(field.width, 440);
  assert.equal(field.height, 240);
  assert.ok(field.spacing > 0);
  for (const dot of field.dots) {
    assert.equal(dot.x, dot.rx);
    assert.equal(dot.y, dot.ry);
    assert.equal(dot.vx, 0);
    assert.equal(dot.vy, 0);
  }
  const xs = field.dots.map((dot) => dot.rx);
  assert.ok(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - field.width / 2) < 1e-9);
});

test('pointerRadius starts above spacing and caps at 2.5x spacing', () => {
  const field = makeField();
  assert.ok(pointerRadius(field, 0) > field.spacing);
  assert.ok(pointerRadius(field, 500) > pointerRadius(field, 0));
  assert.equal(pointerRadius(field, 1_000_000), 2.5 * field.spacing);
});

test('a pointer pushes only the dots inside its radius', () => {
  const field = makeField();
  const spacing = field.spacing;
  const pointer = { x: field.width / 2, y: field.height / 2, holdMs: 0 };
  const radius = pointerRadius(field, pointer.holdMs);

  const outside = field.dots.find(
    (dot) => Math.hypot(dot.rx - pointer.x, dot.ry - pointer.y) >= radius,
  );
  const inside = field.dots.find(
    (dot) => Math.hypot(dot.rx - pointer.x, dot.ry - pointer.y) < radius,
  );
  assert.ok(outside, 'expected a dot outside the radius');
  assert.ok(inside, 'expected a dot inside the radius');

  step(field, pointer, 16);

  const outsideDistance = Math.hypot(outside.x - outside.rx, outside.y - outside.ry);
  const insideDistance = Math.hypot(inside.x - inside.rx, inside.y - inside.ry);
  assert.ok(insideDistance > 0, 'inside dot should move');
  assert.ok(outsideDistance < 1e-9, 'outside dot should stay at rest');
  assert.ok(insideDistance <= spacing, 'one frame should not fling dots across the grid');
});

test('a displaced field settles within 300 frames once the pointer is removed', () => {
  const field = makeField();
  const pointer = { x: field.width / 2, y: field.height / 2, holdMs: 1500 };

  for (let frame = 0; frame < 40; frame += 1) step(field, pointer, 16);
  assert.equal(isSettled(field), false);

  for (let frame = 0; frame < 300; frame += 1) step(field, null, 16);
  assert.equal(isSettled(field), true);
});

test('displacementRatio normalises distance by spacing and clamps at one', () => {
  const field = makeField();
  const dot = { x: field.spacing / 2, y: 0, rx: 0, ry: 0 };
  assert.equal(displacementRatio(dot, field), 0.5);
  assert.equal(displacementRatio({ x: field.spacing * 4, y: 0, rx: 0, ry: 0 }, field), 1);
});

test('dotColor blends rest into peak and clamps the ratio', () => {
  assert.equal(dotColor(0).toLowerCase(), REST_COLOR.toLowerCase());
  assert.equal(dotColor(1).toLowerCase(), PEAK_COLOR.toLowerCase());
  assert.equal(dotColor(-3).toLowerCase(), REST_COLOR.toLowerCase());
  assert.equal(dotColor(9).toLowerCase(), PEAK_COLOR.toLowerCase());

  const mid = dotColor(0.5);
  assert.match(mid, /^#[0-9a-f]{6}$/);
  assert.notEqual(mid, REST_COLOR.toLowerCase());
  assert.notEqual(mid, PEAK_COLOR.toLowerCase());
  assert.equal(mid, '#72cccf');
});
