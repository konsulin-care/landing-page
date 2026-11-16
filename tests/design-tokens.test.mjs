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

const htmlFiles = walk(join(root, "layouts")).filter((f) => f.endsWith(".html"));

const B = "(?<![\\w-])";
const banned = [
  new RegExp(`${B}(?:gray|slate|zinc|primary|secondary|neutral)-`),
  new RegExp(`${B}shadow-`),
  /rounded-3xl/,
  /text-justify/,
  /(?<![\w-])dark:/,
  /text-\[\d+px\]/,
  /\[#[0-9a-fA-F]{3,8}\]/,
];

test("layouts html files contain no legacy color classes, shadows, rounded-3xl, text-justify, dark: variants, text-[Npx] or arbitrary hex classes", () => {
  for (const f of htmlFiles) {
    const src = readFileSync(f, "utf8");
    for (const re of banned) {
      assert.ok(!re.test(src), `${f} matches ${re}`);
    }
  }
});

test("all page layouts call page-header and blog and research single layouts call summary-card", () => {
  for (const p of [
    "_default/single.html",
    "_default/list.html",
    "research/list.html",
    "research/single.html",
    "feature/list.html",
    "pricing/list.html",
    "pricing/single.html",
    "contact/single.html",
  ]) {
    assert.match(read(`layouts/${p}`), /partial\s+"page-header/, p);
  }
  for (const p of ["_default/single.html", "research/single.html"]) {
    assert.match(read(`layouts/${p}`), /partial\s+"summary-card/, p);
  }
});

test("hugo.yaml main menu labels are Home, Research, FAQ, About, Blog in that order", () => {
  const y = read("hugo.yaml");
  const block = y.split(/^menu:\n {2}main:\n/m)[1].split(/^ {2}footer:/m)[0];
  const names = [...block.matchAll(/^\s+name:\s*(.+)$/gm)].map((m) => m[1].trim());
  assert.deepEqual(names, ["Home", "Research", "FAQ", "About", "Blog"]);
});
