import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), "utf8");

const header = read("layouts/partials/page-header.html");

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
