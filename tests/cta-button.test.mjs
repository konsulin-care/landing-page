import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), "utf8");

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

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
  assert.match(html, /"px-7"/, "default size renders px-7");
  assert.match(html, /if eq \$size "sm"[\s\S]{0,120}?px-4 text-sm/,
    "sm renders px-4 text-sm");
  assert.match(html, /else if eq \$size "lg"[\s\S]{0,120}?px-9 py-4 text-base/,
    "lg renders px-9 py-4 text-base");
});

test("button.html is a pill: rounded-full and no rounded-lg", () => {
  const html = read("layouts/partials/button.html");
  assert.match(html, /rounded-full/);
  assert.doesNotMatch(html, /rounded-lg/);
});

test("button.html default size uses px-7 and lg uses px-9, never px-6 or px-8", () => {
  const html = read("layouts/partials/button.html");
  assert.match(html, /\$sizeClass := "px-7"/);
  assert.match(html, /else if eq \$size "lg"[\s\S]{0,120}?px-9/);
  assert.doesNotMatch(html, /px-6|px-8/);
});

test("button.html tone param: default keeps turquoise-deep hover, on-dark hovers to background", () => {
  const html = read("layouts/partials/button.html");
  assert.match(html, /\.tone/, "reads the tone param");
  assert.match(html, /eq \$tone "on-dark"/, "branches on the on-dark tone");
  const onDark = html.match(/eq \$tone "on-dark"([\s\S]*?)\{\{-?\s*end/);
  assert.ok(onDark, "on-dark branch exists");
  assert.match(onDark[1], /hover:bg-background hover:text-foreground/);
  assert.match(onDark[1], /outline-background/);
  assert.doesNotMatch(onDark[1], /turquoise-deep/);
  assert.match(html, /hover:bg-turquoise-deep hover:text-background/);
  assert.match(html, /outline-ring/);
  assert.match(html, /bg-cta text-foreground/);
});

test("button.html emits the label with no whitespace before </a>", () => {
  const html = read("layouts/partials/button.html");
  assert.match(html, />\{\{ \.label \}\}<\/a>/);
  assert.match(html, />\{\{ \.label \}\}<\/button>/);
});

test("no layouts/*.html file combines bg-foreground with text-background hover:bg-charcoal-700", () => {
  const htmlFiles = walk(join(root, "layouts")).filter((f) => f.endsWith(".html"));
  for (const f of htmlFiles) {
    const src = readFileSync(f, "utf8");
    const combines =
      /bg-foreground/.test(src) &&
      /text-background/.test(src) &&
      /hover:bg-charcoal-700/.test(src);
    assert.ok(
      !combines,
      `${f} combines bg-foreground with text-background hover:bg-charcoal-700`,
    );
  }
});

test("nav.html, home-why-it-matters.html and contact/single.html call partial button.html", () => {
  for (const p of [
    "layouts/partials/nav.html",
    "layouts/partials/home-why-it-matters.html",
    "layouts/contact/single.html",
  ]) {
    assert.match(read(p), /partial\s+"button\.html"/, `${p} must call partial button.html`);
  }
});

test("the three CTAs pass the expected params to button.html", () => {
  assert.match(
    read("layouts/partials/nav.html"),
    /partial\s+"button\.html"[^\n]*"size"\s+"sm"/,
    "nav Login uses size sm",
  );
  assert.match(
    read("layouts/partials/home-why-it-matters.html"),
    /partial\s+"button\.html"[^\n]*"size"\s+"lg"/,
    "why-it-matters CTA uses size lg",
  );
  assert.match(
    read("layouts/contact/single.html"),
    /partial\s+"button\.html"[^\n]*"type"\s+"submit"/,
    "contact submit uses type submit",
  );
});

test("nav.html mobile-menu toggle button is still present", () => {
  const nav = read("layouts/partials/nav.html");
  assert.match(nav, /<button[^>]*@click="open = !open"/);
  assert.match(nav, /aria-controls="menuItems"/);
});
