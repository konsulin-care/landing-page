import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timelinePosition, todayISO } from '../assets/js/timeline.js';

const ITEMS = [
  { start: '2024-01-10', end: '2024-01-12' },
  { start: '2024-02-20', end: '2024-02-25' },
  { start: '2024-04-01' },
];

test('today before the first start: all next, marker before at index 0', () => {
  const { states, marker, nextIndex, daysToNext } = timelinePosition(ITEMS, '2024-01-01');
  assert.deepEqual(states, ['next', 'next', 'next']);
  assert.equal(marker.type, 'before');
  assert.equal(marker.index, 0);
  assert.equal(marker.fraction, 0);
  assert.equal(nextIndex, 0);
  assert.equal(daysToNext, 9);
});

test('today after the last end: all done, marker after at last index', () => {
  const { states, marker, nextIndex, daysToNext } = timelinePosition(ITEMS, '2024-05-01');
  assert.deepEqual(states, ['done', 'done', 'done']);
  assert.equal(marker.type, 'after');
  assert.equal(marker.index, 2);
  assert.equal(marker.fraction, 0);
  assert.equal(nextIndex, null);
  assert.equal(daysToNext, null);
});

test('today inside a multi-day window is current and marker within at that index', () => {
  const { states, marker, nextIndex, daysToNext } = timelinePosition(ITEMS, '2024-02-22');
  assert.deepEqual(states, ['done', 'current', 'next']);
  assert.equal(marker.type, 'within');
  assert.equal(marker.index, 1);
  assert.equal(marker.fraction, 0);
  assert.equal(nextIndex, 2);
  assert.equal(daysToNext, 39);
});

test('inclusive window boundaries count as current', () => {
  const start = timelinePosition(ITEMS, '2024-01-10');
  assert.deepEqual(start.states, ['current', 'next', 'next']);
  assert.equal(start.marker.type, 'within');
  assert.equal(start.marker.index, 0);

  const end = timelinePosition(ITEMS, '2024-01-12');
  assert.deepEqual(end.states, ['current', 'next', 'next']);
  assert.equal(end.marker.type, 'within');
  assert.equal(end.marker.index, 0);
});

test('single-day item without end is current on that day only', () => {
  const sameDay = timelinePosition(ITEMS, '2024-04-01');
  assert.equal(sameDay.states[2], 'current');
  assert.equal(sameDay.marker.type, 'within');
  assert.equal(sameDay.marker.index, 2);
  assert.equal(sameDay.nextIndex, null);

  const dayAfter = timelinePosition(ITEMS, '2024-04-02');
  assert.deepEqual(dayAfter.states, ['done', 'done', 'done']);
});

test('today in the gap: between marker with proportional fraction', () => {
  const { states, marker, nextIndex, daysToNext } = timelinePosition(ITEMS, '2024-01-17');
  assert.deepEqual(states, ['done', 'next', 'next']);
  assert.equal(marker.type, 'between');
  assert.equal(marker.index, 0);
  // end 2024-01-12 to start 2024-02-20 = 39 days; 5 days elapsed -> 5/39.
  assert.equal(marker.fraction, 5 / 39);
  assert.equal(nextIndex, 1);
  assert.equal(daysToNext, 34);
});

test('daysToNext is null when no item is next', () => {
  const { nextIndex, daysToNext } = timelinePosition(ITEMS, '2024-02-25');
  assert.equal(nextIndex, 2);
  assert.equal(daysToNext, 36);

  const finished = timelinePosition(ITEMS, '2024-04-01');
  assert.equal(finished.daysToNext, null);
});

test('todayISO formats the local calendar date as YYYY-MM-DD', () => {
  assert.equal(todayISO(new Date(2024, 0, 5, 23, 30)), '2024-01-05');
  assert.equal(todayISO(new Date(2024, 11, 31, 0, 0)), '2024-12-31');
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
});
