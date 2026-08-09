// Citizen-science pixel morph stage.
// Vanilla canvas mosaic: the active phrase is drawn as monochrome ink and
// sampled into a coarse block grid; on each cycle the blocks dissolve, flip,
// and resolve into the next phrase while the words stay in the same physical
// position. Respects prefers-reduced-motion (static fallback), re-renders on
// resize and theme change, and announces the active phrase via aria-live.
(function () {
  'use strict';

  const canvas = document.querySelector('.cs-morph-canvas');
  if (!canvas) return; // stage not on this page

  const phraseEls = Array.from(document.querySelectorAll('[data-cs-phrase]'));
  if (phraseEls.length === 0) return;

  const live = document.querySelector('[data-cs-live]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Phrases come from the DOM (config-driven in Hugo).
  const phrases = phraseEls.map((el) => ({
    title: el.getAttribute('data-cs-title') || '',
    text: el.textContent.trim(),
  }));

  // A phrase stays fully readable, then morphs into the next in ~1s.
  const VISIBLE_MS = 2200;
  const MORPH_MS = 1000;
  const BLOCK_PX = 14; // coarse mosaic block at DPR 1
  const STAGE_H = 200; // canvas layout height (CSS px)

  const ctx = canvas.getContext('2d');
  let raf = 0;
  let index = 0;
  let phase = 'visible';
  let t0 = performance.now();
  let current = [];
  let next = [];
  let resizeTimer = 0;
  let themeObserver = null;
  let fontReady = false;

  // ------------------------------------------------------------- helpers

  // Monochrome ink sampled from the computed text color so light/dark theme
  // switches re-render correctly without hardcoded colors.
  function inkColor() {
    const probe = document.createElement('span');
    probe.className = 'text-gray-900 dark:text-gray-100';
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;';
    probe.textContent = 'I';
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }

  function titleSize() {
    const w = canvas.clientWidth || 320;
    if (w < 640) return 36;
    if (w < 1024) return 44;
    return 56;
  }

  // Rasterize the phrase and extract coarse ink blocks.
  function sample(phrase) {
    const cssW = canvas.clientWidth || 320;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(1, Math.round(cssW * dpr));
    const H = Math.max(1, Math.round(STAGE_H * dpr));

    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const octx = off.getContext('2d');

    const titlePx = Math.round(titleSize() * dpr);
    const textPx = Math.round(titlePx * 0.42);
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillStyle = inkColor();

    const cx = W / 2;
    const titleY = H * 0.4;
    const textY = H * 0.68;
    octx.font = `600 ${titlePx}px ${fontFamily()}`;
    octx.fillText(phrase.title, cx, titleY);
    octx.font = `400 ${textPx}px ${fontFamily()}`;
    octx.fillText(phrase.text, cx, textY);

    const img = octx.getImageData(0, 0, W, H).data;
    const b = Math.max(6, Math.round(BLOCK_PX * dpr));
    const blocks = [];
    for (let y = 0; y < H; y += b) {
      for (let x = 0; x < W; x += b) {
        let on = false;
        for (let j = 0; j < b && !on; j += 3) {
          for (let i = 0; i < b && !on; i += 3) {
            const idx = ((y + j) * W + (x + i)) * 4 + 3;
            if (img[idx] > 40) on = true;
          }
        }
        if (on) {
          blocks.push({
            x: x / dpr,
            y: y / dpr,
            s: b / dpr,
            d: (x + y) % 260, // staggered per-block delay
          });
        }
      }
    }
    return blocks;
  }

  function fontFamily() {
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue('--font-sans')
        .trim()
        .split(',')[0]
        .replace(/"/g, '') || 'sans-serif'
    );
  }

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  // ------------------------------------------------------------- rendering

  // progress eases 0..1 with a flip (vertical collapse and restore).
  function flip(progress) {
    return Math.abs(Math.cos(progress * Math.PI));
  }

  function drawBlocks(blocks, elapsed, isNext, staticMode) {
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.fillStyle = inkColor();
    for (const block of blocks) {
      if (staticMode) {
        // Visible "hold": every block at full size and opacity — readable text.
        ctx.fillRect(block.x * dpr, block.y * dpr, block.s * dpr, block.s * dpr);
        continue;
      }
      const t = clamp((elapsed - block.d) / (MORPH_MS - 260), 0, 1);
      const progress = isNext ? t : 1 - t; // in: 0→1, out: 1→0
      if (progress <= 0) continue;

      const alpha = progress; // in: fades in, out: fades out
      const scaleY = flip(progress);
      const cx = block.x + block.s / 2;
      const cy = block.y + block.s / 2;

      ctx.save();
      ctx.translate(cx * dpr, cy * dpr);
      ctx.scale(1, scaleY);
      ctx.globalAlpha = alpha * 0.92;
      ctx.fillRect((-block.s / 2) * dpr, (-block.s / 2) * dpr, block.s * dpr, block.s * dpr);
      ctx.restore();
    }
    ctx.restore();
  }

  function announce() {
    if (!live) return;
    const phrase = phrases[index];
    live.textContent = `${phrase.title} ${phrase.text}`;
  }

  // ------------------------------------------------------------- cycle

  function startMorph() {
    phase = 'morph';
    next = sample(phrases[(index + 1) % phrases.length]);
    t0 = performance.now();
  }

  function tick(now) {
    const elapsed = now - t0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (phase === 'visible') {
      drawBlocks(current, elapsed, false, true); // static readable phrase
      if (elapsed >= VISIBLE_MS) startMorph();
    } else {
      drawBlocks(current, elapsed, false); // dissolving out
      drawBlocks(next, elapsed, true); // resolving in
      if (elapsed >= MORPH_MS) {
        current = next;
        index = (index + 1) % phrases.length;
        phase = 'visible';
        t0 = performance.now();
        announce();
      }
    }
    raf = requestAnimationFrame(tick);
  }

  // ------------------------------------------------------------- setup

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 320;
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.round(STAGE_H * dpr);
    current = sample(phrases[index]);
  }

  function start() {
    if (raf) cancelAnimationFrame(raf);
    resize();
    phase = 'visible';
    t0 = performance.now();
    announce();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function handleReducedMotion() {
    if (reducedMotion.matches) stop();
    else start();
  }

  function init() {
    if (reducedMotion.matches) return; // static fallback list handles it

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150); // debounced re-render
    });

    // Theme change (class-based dark mode toggles .dark on <html>).
    themeObserver = new MutationObserver(() => {
      if (phase === 'visible') current = sample(phrases[index]);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    if (typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', handleReducedMotion);
    }

    start();
  }

  // Gate the first draw on font loading so text metrics match the page font.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(init);
  } else {
    init();
  }
})();
