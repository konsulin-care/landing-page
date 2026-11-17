import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), "utf8");

const header = read("layouts/partials/page-header.html");
const defaultSingle = read("layouts/_default/single.html");
const researchSingle = read("layouts/research/single.html");
const contactSingle = read("layouts/contact/single.html");
const pricingSingle = read("layouts/pricing/single.html");

/** Extract the width param passed to page-header.html, or null. */
const headerWidth = (src) => {
  const m = src.match(/partial\s+"page-header\.html"[^}]*"width"\s+"([^"]+)"/);
  return m ? m[1] : null;
};

/** Extract the max-w class of the main body wrapper (first div/article). */
const bodyMaxWidth = (src) => {
  const m = src.match(/<(?:div|article)\s+class="(max-w-[a-z0-9-]+)/);
  return m ? m[1] : null;
};

test("page-header.html inner wrapper defaults to max-w-6xl when no width is passed", () => {
  assert.match(
    header,
    /\$width\s*:?=\s*(?:default\s+"max-w-6xl"|\|?\s*default\s+"max-w-6xl"|"max-w-6xl"\s*\|\s*default)/,
    "width param must default to max-w-6xl"
  );
});

test("page-header.html applies the width param to the inner wrapper class", () => {
  assert.match(
    header,
    /<div class="\{\{\s*\$width\s*\}\}\s+mx-auto px-6 py-12">/,
    "inner wrapper must render {{ $width }} mx-auto px-6 py-12"
  );
});

test("page-header.html description paragraph keeps max-w-2xl", () => {
  assert.match(
    header,
    /<p class="mt-4 text-muted-foreground max-w-2xl">/,
    "description paragraph must keep max-w-2xl"
  );
});

test("_default/single passes a header width equal to its body wrapper max-w class", () => {
  assert.equal(headerWidth(defaultSingle), "max-w-2xl", "must pass width max-w-2xl");
  assert.equal(
    headerWidth(defaultSingle),
    bodyMaxWidth(defaultSingle),
    "header width must equal the body wrapper width"
  );
});

test("research/single passes a header width equal to its body wrapper max-w class", () => {
  assert.equal(headerWidth(researchSingle), "max-w-3xl", "must pass width max-w-3xl");
  assert.equal(
    headerWidth(researchSingle),
    bodyMaxWidth(researchSingle),
    "header width must equal the body wrapper width"
  );
});

test("contact/single passes a header width equal to its body wrapper max-w class", () => {
  assert.equal(headerWidth(contactSingle), "max-w-2xl", "must pass width max-w-2xl");
  assert.equal(
    headerWidth(contactSingle),
    bodyMaxWidth(contactSingle),
    "header width must equal the body wrapper width"
  );
});

test("contact/single.html has no nested max-w-screen-md or max-w-xl wrapper", () => {
  assert.ok(
    !contactSingle.includes("max-w-screen-md"),
    "nested max-w-screen-md wrapper must be removed"
  );
  assert.ok(!contactSingle.includes("max-w-xl"), "max-w-xl image wrapper must be removed");
});

test("pricing/single.html header stays max-w-6xl and inner prose is left-aligned", () => {
  assert.equal(
    headerWidth(pricingSingle),
    null,
    "pricing must not pass a width param (header stays max-w-6xl)"
  );
  const prose = pricingSingle.match(/<div class="max-w-2xl[^"]*prose[^"]*">/);
  assert.ok(prose, "pricing must keep an inner max-w-2xl prose block");
  assert.ok(!prose[0].includes("mx-auto"), "inner max-w-2xl prose must not have mx-auto");
});

const listLayouts = {
  "_default/list.html": read("layouts/_default/list.html"),
  "feature/list.html": read("layouts/feature/list.html"),
  "pricing/list.html": read("layouts/pricing/list.html"),
};

const cardGridTemplates = {
  "posts-template": read("layouts/partials/posts-template.html"),
  "features-template": read("layouts/partials/features-template.html"),
  "pricings-template": read("layouts/partials/pricings-template.html"),
};

for (const [name, src] of Object.entries(cardGridTemplates)) {
  test(`${name} card grid wrapper uses px-6 not-prose to match the header`, () => {
    assert.match(
      src,
      /<div class="px-6 not-prose">/,
      "outer padding wrapper must be px-6 not-prose"
    );
    assert.ok(
      !src.includes('class="px-4 not-prose"'),
      "px-4 not-prose wrapper must be replaced by px-6 not-prose"
    );
  });
}

for (const [name, src] of Object.entries(listLayouts)) {
  test(`${name} wraps intro content in a max-w-6xl px-6 mx-auto outer div`, () => {
    assert.match(
      src,
      /<div class="max-w-6xl px-6 mx-auto mt-6">/,
      "outer intro wrapper must be max-w-6xl px-6 mx-auto mt-6"
    );
  });

  test(`${name} intro inner prose is max-w-2xl without mx-auto`, () => {
    const nested = src.match(
      /<div class="max-w-6xl px-6 mx-auto mt-6">\s*<div class="(max-w-2xl[^"]*prose[^"]*)">/
    );
    assert.ok(
      nested,
      "outer max-w-6xl wrapper must directly contain an inner max-w-2xl prose div"
    );
    assert.ok(!nested[1].includes("mx-auto"), "inner prose must not have mx-auto");
  });
}
