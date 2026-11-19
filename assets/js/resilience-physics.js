// Pure physics for the "Lentur lalu pulih" hero dot field.
// No DOM access: the canvas wiring lives in resilience-field.js so the model
// can be unit-tested in Node.

/** Resting dot colour (charcoal-200). */
export const REST_COLOR = '#DADBDB';

/** Fully displaced dot colour (turquoise). */
export const PEAK_COLOR = '#0ABDC3';

/** Spring constant in 1/s^2 for the rest-position restoring force. */
const K = 180;

/** Damping coefficient in 1/s for the velocity term. */
const C = 18;

/** Pointer push acceleration in px/s^2 at the centre of the radius. */
const PUSH = 1200;

/** Radius growth per millisecond held, relative to spacing. */
const GROW = 0.0008;

/** Settling tolerance in px for position. */
const SETTLE_POS = 0.5;

/** Settling tolerance for velocity magnitude. */
const SETTLE_VEL = 0.05;

/**
 * Parses a `#rrggbb` colour into its channel triple.
 * @param {string} hex colour string
 * @returns {{ r: number, g: number, b: number }} channel values 0-255
 */
function parseHex(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/**
 * Formats a channel triple as a lowercase `#rrggbb` string.
 * @param {{ r: number, g: number, b: number }} rgb channel values 0-255
 * @returns {string} hex colour string
 */
function toHex(rgb) {
  const part = (value) =>
    Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`;
}

/**
 * Builds an evenly spaced, centred grid of resting dots.
 * @param {number} cols number of columns
 * @param {number} rows number of rows
 * @param {number} width field width in CSS pixels
 * @param {number} height field height in CSS pixels
 * @returns {{ dots: Array<{ rx: number, ry: number, x: number, y: number, vx: number, vy: number }>, width: number, height: number, spacing: number }} field state
 */
export function createField(cols, rows, width, height) {
  const safeCols = Math.max(1, Math.floor(cols));
  const safeRows = Math.max(1, Math.floor(rows));
  const spacing = Math.min(width / safeCols, height / safeRows);
  const dots = [];
  for (let row = 0; row < safeRows; row += 1) {
    for (let col = 0; col < safeCols; col += 1) {
      const rx = width / 2 + (col - (safeCols - 1) / 2) * spacing;
      const ry = height / 2 + (row - (safeRows - 1) / 2) * spacing;
      dots.push({ rx, ry, x: rx, y: ry, vx: 0, vy: 0 });
    }
  }
  return { dots, width, height, spacing };
}

/**
 * Pointer influence radius, widening with hold time up to a cap.
 * @param {ReturnType<typeof createField>} field field state
 * @param {number} holdMs how long the pointer has been held, in milliseconds
 * @returns {number} radius in CSS pixels
 */
export function pointerRadius(field, holdMs) {
  const base = 1.2 * field.spacing;
  const cap = 2.5 * field.spacing;
  const held = Math.max(0, holdMs || 0);
  return Math.min(base + held * GROW, cap);
}

/**
 * Advances the field by one frame: pointer repulsion plus a damped spring
 * back to each dot's rest position, integrated with semi-implicit Euler.
 * @param {ReturnType<typeof createField>} field field state, mutated in place
 * @param {{ x: number, y: number, holdMs: number } | null} pointer active pointer or null
 * @param {number} dtMs elapsed time for this frame, in milliseconds
 * @returns {ReturnType<typeof createField>} the same field for chaining
 */
export function step(field, pointer, dtMs) {
  const dt = Math.max(0, dtMs || 0) / 1000;
  if (dt === 0) return field;
  const radius = pointer ? pointerRadius(field, pointer.holdMs) : 0;

  for (const dot of field.dots) {
    let ax = -K * (dot.x - dot.rx) - C * dot.vx;
    let ay = -K * (dot.y - dot.ry) - C * dot.vy;

    if (pointer && radius > 0) {
      const dx = dot.x - pointer.x;
      const dy = dot.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < radius) {
        const strength = 1 - d / radius;
        const ux = d > 0 ? dx / d : 1;
        const uy = d > 0 ? dy / d : 0;
        ax += ux * strength * PUSH;
        ay += uy * strength * PUSH;
      }
    }

    dot.vx += ax * dt;
    dot.vy += ay * dt;
    dot.x += dot.vx * dt;
    dot.y += dot.vy * dt;
  }

  return field;
}

/**
 * Reports whether every dot has come back to rest and stopped moving.
 * @param {ReturnType<typeof createField>} field field state
 * @returns {boolean} true when the field is visually settled
 */
export function isSettled(field) {
  return field.dots.every((dot) => {
    const dx = dot.x - dot.rx;
    const dy = dot.y - dot.ry;
    return Math.hypot(dx, dy) <= SETTLE_POS && Math.hypot(dot.vx, dot.vy) < SETTLE_VEL;
  });
}

/**
 * Normalised displacement of a dot from its rest position.
 * @param {{ x: number, y: number, rx: number, ry: number }} dot dot state
 * @param {ReturnType<typeof createField>} field field state
 * @returns {number} ratio in the 0-1 range
 */
export function displacementRatio(dot, field) {
  const distance = Math.hypot(dot.x - dot.rx, dot.y - dot.ry);
  return Math.min(distance / field.spacing, 1);
}

/**
 * Blends the rest colour into the peak colour by displacement ratio.
 * @param {number} ratio displacement ratio, clamped to the 0-1 range
 * @returns {string} lowercase `#rrggbb` colour
 */
export function dotColor(ratio) {
  const t = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  const rest = parseHex(REST_COLOR);
  const peak = parseHex(PEAK_COLOR);
  return toHex({
    r: rest.r + (peak.r - rest.r) * t,
    g: rest.g + (peak.g - rest.g) * t,
    b: rest.b + (peak.b - rest.b) * t,
  });
}
