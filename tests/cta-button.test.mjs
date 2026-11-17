import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), "utf8");

test("main.css @theme defines --color-cta: var(--color-turquoise)", () => {
  const css = read("assets/css/main.css");
  const theme = css.match(/@theme\s*\{([\s\S]*?)\n\}/);
  assert.ok(theme, "assets/css/main.css has an @theme block");
  assert.match(theme[1], /--color-cta:\s*var\(--color-turquoise\)/);
});

test("main.css still defines --color-accent: var(--color-turquoise-tint)", () => {
  const css = read("assets/css/main.css");
  const theme = css.match(/@theme\s*\{([\s\S]*?)\n\}/);
  assert.ok(theme, "assets/css/main.css has an @theme block");
  assert.match(theme[1], /--color-accent:\s*var\(--color-turquoise-tint\)/);
});

test("docs/DESIGN_TOKENS.md mentions the cta token", () => {
  const doc = read("docs/DESIGN_TOKENS.md");
  assert.match(doc, /cta/);
});
