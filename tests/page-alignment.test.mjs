import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), "utf8");

const defaultSingle = read("layouts/_default/single.html");
const researchSingle = read("layouts/research/single.html");
const contactSingle = read("layouts/contact/single.html");

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

test("_default/single passes a header width equal to its body wrapper max-w class", () => {
  assert.equal(
    headerWidth(defaultSingle),
    bodyMaxWidth(defaultSingle),
    "header width must equal the body wrapper width"
  );
});

test("research/single passes a header width equal to its body wrapper max-w class", () => {
  assert.equal(
    headerWidth(researchSingle),
    bodyMaxWidth(researchSingle),
    "header width must equal the body wrapper width"
  );
});

test("contact/single passes a header width equal to its body wrapper max-w class", () => {
  assert.equal(
    headerWidth(contactSingle),
    bodyMaxWidth(contactSingle),
    "header width must equal the body wrapper width"
  );
});
