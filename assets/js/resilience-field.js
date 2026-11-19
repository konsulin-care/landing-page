// DOM wiring for the "Lentur lalu pulih" hero dot field.
// The physics model is pure and lives in resilience-physics.js; this module
// measures the canvas, feeds pointer and ghost state into step() and paints
// the dots. It is a vanilla ES module bundled by Hugo's js.Build.

import {
  createField,
  displacementRatio,
  dotColor,
  fieldState,
  ghostPointer,
  gridFor,
  isSettled,
  pointerRadius,
  step,
} from './resilience-physics.js';

/** Ring colour drawn under a touch pointer and the first-view ghost. */
const RING_COLOR = '#D8F1F1';
/** Cap on the device pixel ratio used for the canvas backing store. */
const DPR_CAP = 2;
/** Largest frame delta integrated in a single step, in milliseconds. */
const MAX_DT = 100;
/** Viewport width at which dots grow from 2px to 2.5px. */
const WIDE_PX = 768;

/**
 * Clamps a number into an inclusive range.
 * @param {number} value input value
 * @param {number} min lower bound
 * @param {number} max upper bound
 * @returns {number} clamped value
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Classifies a pointer event as mouse or touch so the ring only appears for
 * touch input and the ghost.
 * @param {{ pointerType?: string }} event pointer event
 * @returns {'mouse' | 'touch'} input kind
 */
function kindOf(event) {
  return event && event.pointerType === 'mouse' ? 'mouse' : 'touch';
}

/**
 * Mounts the interactive dot field on a `[data-jt-field]` figure.
 * Respects prefers-reduced-motion (returns without scheduling any frame),
 * rebuilds on resize, runs the ghost sweep once on first view and keeps the
 * caption text in sync with the field state.
 * @param {HTMLElement} root the figure element carrying `data-jt-field`
 * @param {object} [env] optional injected environment (`window`,
 *   `requestAnimationFrame`, `now`, `IntersectionObserver`, `ResizeObserver`)
 * @returns {boolean|null} true when mounted, null when skipped
 */
export function mountField(root, env = {}) {
  if (!root || typeof root.querySelector !== 'function') return null;
  const win = env.window ?? (typeof window !== 'undefined' ? window : null);
  if (!win) return null;

  const reduced =
    typeof win.matchMedia === 'function' &&
    win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return null;

  const canvas = root.querySelector('canvas');
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const captionEl = root.querySelector('[data-jt-field-caption]');

  const raf =
    env.requestAnimationFrame ?? win.requestAnimationFrame ?? globalThis.requestAnimationFrame;
  if (typeof raf !== 'function') return null;
  const now =
    env.now ??
    (() => {
      const perf = win.performance;
      return perf && typeof perf.now === 'function' ? perf.now() : Date.now();
    });
  const Intersection =
    env.IntersectionObserver ?? win.IntersectionObserver ?? globalThis.IntersectionObserver;
  const Resize = env.ResizeObserver ?? win.ResizeObserver ?? globalThis.ResizeObserver;

  let field = null;
  let cssW = 1;
  let cssH = 1;
  let pointer = null;
  let pressed = false;
  let pressStart = 0;
  let touched = false;
  let ghostStart = null;
  let hasIntersected = false;
  let intersecting = true;
  let rafId = 0;
  let last = null;

  const measure = () => {
    const rect =
      typeof canvas.getBoundingClientRect === 'function' ? canvas.getBoundingClientRect() : null;
    const width = rect && rect.width > 0 ? rect.width : canvas.clientWidth;
    const height = rect && rect.height > 0 ? rect.height : canvas.clientHeight;
    return {
      width: Math.max(1, Math.round(width || 1)),
      height: Math.max(1, Math.round(height || 1)),
    };
  };

  const resize = () => {
    const box = measure();
    cssW = box.width;
    cssH = box.height;
    const dpr = Math.min(Number(win.devicePixelRatio) || 1, DPR_CAP);
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    if (typeof ctx.setTransform === 'function') ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const grid = gridFor(cssW);
    field = createField(grid.cols, grid.rows, cssW, cssH);
  };

  const localPoint = (event) => {
    const rect =
      typeof canvas.getBoundingClientRect === 'function'
        ? canvas.getBoundingClientRect()
        : { left: 0, top: 0 };
    const hasClient = Number.isFinite(event.clientX) && Number.isFinite(event.clientY);
    const rawX = hasClient ? event.clientX - (rect.left || 0) : event.offsetX || 0;
    const rawY = hasClient ? event.clientY - (rect.top || 0) : event.offsetY || 0;
    return { x: clamp(rawX, 0, cssW), y: clamp(rawY, 0, cssH) };
  };

  const drawRing = (p) => {
    if (typeof ctx.arc !== 'function') return;
    ctx.beginPath();
    ctx.strokeStyle = RING_COLOR;
    ctx.lineWidth = 1;
    ctx.arc(p.x, p.y, pointerRadius(field, p.holdMs || 0), 0, Math.PI * 2);
    if (typeof ctx.stroke === 'function') ctx.stroke();
  };

  const draw = (p) => {
    if (typeof ctx.clearRect === 'function') ctx.clearRect(0, 0, cssW, cssH);
    if (p && p.kind !== 'mouse') drawRing(p);
    const radius = cssW < WIDE_PX ? 2 : 2.5;
    for (const dot of field.dots) {
      ctx.beginPath();
      ctx.fillStyle = dotColor(displacementRatio(dot, field));
      ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const syncCaption = (p) => {
    if (!captionEl || typeof captionEl.getAttribute !== 'function') return;
    const state = fieldState(field, p, touched);
    const text = captionEl.getAttribute(`data-${state}`) ?? captionEl.getAttribute('data-idle');
    if (text !== null && text !== undefined && captionEl.textContent !== text) {
      captionEl.textContent = text;
    }
  };

  const effectivePointer = (t) => {
    if (ghostStart !== null) {
      if (!touched) {
        const ghost = ghostPointer(t - ghostStart, field.width, field.height);
        if (ghost) return { ...ghost, kind: 'ghost' };
      }
      ghostStart = null;
    }
    return pointer;
  };

  const frame = () => {
    rafId = 0;
    if (!intersecting) {
      last = null;
      return;
    }
    const t = now();
    const dt = last === null ? 16 : Math.min(Math.max(t - last, 1), MAX_DT);
    last = t;
    if (pressed && pointer) pointer = { ...pointer, holdMs: Math.max(0, t - pressStart) };
    const active = effectivePointer(t);
    step(field, active, dt);
    draw(active);
    syncCaption(active);
    if (active || ghostStart !== null || !isSettled(field)) rafId = raf(frame);
  };

  const ensureLoop = () => {
    if (!intersecting || rafId) return;
    last = null;
    rafId = raf(frame);
  };

  const markTouched = () => {
    touched = true;
    ghostStart = null;
  };

  const onDown = (event) => {
    markTouched();
    const point = localPoint(event);
    pressed = true;
    pressStart = now();
    pointer = { x: point.x, y: point.y, holdMs: 0, kind: kindOf(event) };
    syncCaption(pointer);
    ensureLoop();
  };

  const onMove = (event) => {
    const kind = kindOf(event);
    if (pressed) {
      markTouched();
      const point = localPoint(event);
      pointer = {
        x: point.x,
        y: point.y,
        holdMs: Math.max(0, now() - pressStart),
        kind: pointer ? pointer.kind : kind,
      };
      syncCaption(pointer);
      ensureLoop();
      return;
    }
    if (kind === 'touch') return;
    markTouched();
    const point = localPoint(event);
    pointer = { x: point.x, y: point.y, holdMs: 0, kind: 'mouse' };
    syncCaption(pointer);
    ensureLoop();
  };

  const release = () => {
    pressed = false;
    pointer = null;
    syncCaption(null);
    ensureLoop();
  };

  const listen = (type, handler) => {
    if (typeof canvas.addEventListener === 'function') canvas.addEventListener(type, handler);
  };
  listen('pointerdown', onDown);
  listen('pointermove', onMove);
  listen('pointerup', release);
  listen('pointercancel', release);
  listen('pointerleave', release);

  if (typeof Intersection === 'function') {
    const observer = new Intersection((entries) => {
      const entry = Array.isArray(entries) ? entries[0] : entries;
      intersecting = Boolean(entry && entry.isIntersecting);
      if (!intersecting) return;
      if (!hasIntersected) {
        hasIntersected = true;
        if (!touched) ghostStart = now();
      }
      ensureLoop();
    });
    if (observer && typeof observer.observe === 'function') observer.observe(root);
  } else {
    hasIntersected = true;
    if (!touched) ghostStart = now();
    ensureLoop();
  }

  if (typeof Resize === 'function') {
    const observer = new Resize(() => {
      resize();
      draw(pointer);
      syncCaption(pointer);
      if (intersecting && !isSettled(field)) ensureLoop();
    });
    if (observer && typeof observer.observe === 'function') observer.observe(root);
  }

  resize();
  draw(null);
  syncCaption(null);
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    for (const root of document.querySelectorAll('[data-jt-field]')) mountField(root);
  });
}
