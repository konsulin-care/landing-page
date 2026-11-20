// Timeline positioning for the linimasa section.
// Pure helpers: no DOM access except the final window bridge, so the module
// can be imported directly by the Node test suite as well as bundled by Hugo.

const DAY_MS = 86400000;

/**
 * Convert a calendar date string (YYYY-MM-DD) to an absolute day number.
 * Parsing goes through Date.UTC so no local timezone or DST shift can alter
 * the result.
 * @param {string} iso Date string in YYYY-MM-DD form.
 * @returns {number} Whole days since the Unix epoch.
 */
function toDay(iso) {
  const parts = String(iso).split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

/**
 * Normalise the timeline items: default `end` to `start` and project both
 * boundaries to day numbers.
 * @param {Array<{start: string, end?: string}>} items Timeline entries.
 * @returns {Array<{startDay: number, endDay: number}>} Day-number windows.
 */
function windows(items) {
  return items.map((item) => {
    const startDay = toDay(item.start);
    const endDay = item.end === undefined || item.end === null ? startDay : toDay(item.end);
    return { startDay, endDay };
  });
}

/**
 * Locate "today" on the timeline.
 * @param {Array<{start: string, end?: string}>} items Timeline entries sorted ascending by start.
 * @param {string} today Reference date in YYYY-MM-DD form.
 * @returns {{
 *   states: Array<'done'|'current'|'next'>,
 *   marker: {type: 'before'|'within'|'between'|'after', index: number, fraction: number}|null,
 *   nextIndex: number|null,
 *   daysToNext: number|null
 * }} Per-item states plus marker and next-entry distance.
 */
export function timelinePosition(items, today) {
  const list = Array.isArray(items) ? items : [];
  const todayDay = toDay(today);
  const days = windows(list);

  if (days.length === 0) {
    return { states: [], marker: null, nextIndex: null, daysToNext: null };
  }

  const states = days.map(({ startDay, endDay }) => {
    if (todayDay > endDay) return 'done';
    if (todayDay >= startDay) return 'current';
    return 'next';
  });

  let marker;
  const first = days[0];
  const last = days[days.length - 1];

  if (todayDay < first.startDay) {
    marker = { type: 'before', index: 0, fraction: 0 };
  } else if (todayDay > last.endDay) {
    marker = { type: 'after', index: days.length - 1, fraction: 0 };
  } else {
    const currentIndex = states.indexOf('current');
    if (currentIndex !== -1) {
      marker = { type: 'within', index: currentIndex, fraction: 0 };
    } else {
      let gapIndex = -1;
      let fraction = 0;
      for (let i = 0; i < days.length - 1; i += 1) {
        const endDay = days[i].endDay;
        const nextStart = days[i + 1].startDay;
        if (endDay < todayDay && todayDay < nextStart) {
          gapIndex = i;
          fraction = (todayDay - endDay) / (nextStart - endDay);
          break;
        }
      }
      marker = gapIndex === -1
        ? { type: 'within', index: 0, fraction: 0 }
        : { type: 'between', index: gapIndex, fraction };
    }
  }

  const foundNext = states.indexOf('next');
  const nextIndex = foundNext === -1 ? null : foundNext;
  const daysToNext = nextIndex === null ? null : days[nextIndex].startDay - todayDay;

  return { states, marker, nextIndex, daysToNext };
}

/**
 * Local calendar date formatted as YYYY-MM-DD.
 * The date is read in local time on purpose: the timeline shows the visitor's
 * own day, not the UTC day.
 * @param {Date} [date] Source instant, defaults to the current time.
 * @returns {string} Local calendar date in YYYY-MM-DD form.
 */
export function todayISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

if (typeof window !== 'undefined') {
  window.jtTimeline = { timelinePosition, todayISO };
}
