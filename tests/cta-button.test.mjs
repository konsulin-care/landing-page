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

test("button.html uses CTA colors and no bg-foreground", () => {
  const html = read("layouts/partials/button.html");
  assert.match(html, /bg-cta/);
  assert.match(html, /text-foreground/);
  assert.match(html, /hover:bg-turquoise-deep/);
  assert.match(html, /hover:text-background/);
  assert.doesNotMatch(html, /bg-foreground/);
});

test("button.html renders a <button> when type is set, an <a> otherwise", () => {
  const html = read("layouts/partials/button.html");
  const branch = html.match(
    /\{\{-?\s*if\s+\.type\s*-?\}\}([\s\S]*?)\{\{-?\s*else\s*-?\}\}([\s\S]*?)\{\{-?\s*end\s*-?\}\}/
  );
  assert.ok(branch, "template branches on .type with if/else/end");
  assert.match(branch[1], /<button[^>]*type="/);
  assert.match(branch[1], /<\/button>/);
  assert.match(branch[2], /<a\s+href="/);
  assert.match(branch[2], /<\/a>/);
});

test("button.html supports size values default, sm and lg", () => {
  const html = read("layouts/partials/button.html");
  assert.match(html, /\.size/, "reads the size param");
  assert.match(html, /default "default"/, "size defaults to default");
  assert.match(html, /"px-6"/, "default size renders px-6");
  assert.match(html, /if eq \$size "sm"[\s\S]{0,120}?px-4 text-sm/,
    "sm renders px-4 text-sm");
  assert.match(html, /else if eq \$size "lg"[\s\S]{0,120}?px-8 py-4 text-base/,
    "lg renders px-8 py-4 text-base");
});

test("button.html emits the label with no whitespace before </a>", () => {
  const html = read("layouts/partials/button.html");
  assert.match(html, />\{\{ \.label \}\}<\/a>/);
  assert.match(html, />\{\{ \.label \}\}<\/button>/);
});
