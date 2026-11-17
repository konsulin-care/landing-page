import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.join(import.meta.dirname, "..");

let cachedBuild;

/** Build the site once and reuse the output directory. */
function build() {
  if (cachedBuild) return cachedBuild;

  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "site-menus-"));
  const r = spawnSync("hugo", ["--minify", "--destination", dest], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 60000,
  });
  const out = `${r.stdout}${r.stderr}`;

  cachedBuild = { dest, r, out };
  return cachedBuild;
}

/** Read a value list for a key from a hugo.yaml menu block. */
function values(block, key) {
  const re = new RegExp(`^\\s+${key}:\\s*(.+)$`, "gm");
  return [...block.matchAll(re)].map((m) => m[1].trim().replace(/^["']|["']$/g, ""));
}

/** Extract the rendered footer markup from the home page. */
function footerHtml() {
  const { dest, r, out } = build();
  assert.equal(r.status, 0, out);

  const html = fs.readFileSync(path.join(dest, "index.html"), "utf8");
  const match = html.match(/<footer[\s\S]*?<\/footer>/i);
  assert.ok(match, "home page must render a footer");
  return match[0];
}

/** Extract href and text from each anchor in a markup fragment. */
function anchors(fragment) {
  return [...fragment.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(([, attrs, inner]) => {
    const href = attrs.match(/href=["']?([^"'\s>]+)/i);
    return {
      href: href ? href[1] : "",
      text: inner.replace(/<[^>]*>/g, "").trim(),
    };
  });
}

test("hugo.yaml main menu is Beranda, Riset, FAQ, Tentang, Blog in order", () => {
  const y = fs.readFileSync(path.join(ROOT, "hugo.yaml"), "utf8");
  const block = y.split(/^menu:\n {2}main:\n/m)[1].split(/^ {2}footer:/m)[0];

  assert.deepEqual(values(block, "name"), ["Beranda", "Riset", "FAQ", "Tentang", "Blog"]);
  assert.deepEqual(values(block, "url"), ["/", "/research/", "/faq/", "/about/", "/blog/"]);
});

test("hugo.yaml footer menu is FAQ, Riset, Tentang, Kontak in order", () => {
  const y = fs.readFileSync(path.join(ROOT, "hugo.yaml"), "utf8");
  const block = y.split(/^ {2}footer:\n/m)[1].split(/^\S/m)[0];

  assert.deepEqual(values(block, "name"), ["FAQ", "Riset", "Tentang", "Kontak"]);
  assert.deepEqual(values(block, "url"), ["/faq/", "/research/", "/about/", "/contact/"]);
});

test("rendered footer menu is FAQ, Riset, Tentang, Kontak in order", () => {
  const footer = footerHtml();
  const nav = footer.match(/<nav[^>]*aria-label=["']?Footer["']?[^>]*>([\s\S]*?)<\/nav>/i);
  assert.ok(nav, "footer must render the Footer navigation");

  assert.deepEqual(
    anchors(nav[1]).map((link) => link.text),
    ["FAQ", "Riset", "Tentang", "Kontak"],
  );
});

test("help link appears before the footer menu and points to /faq/#bantuan", () => {
  const footer = footerHtml();
  const help = anchors(footer).find((link) => link.text === "Butuh bantuan sekarang?");

  assert.ok(help, "footer must render the help line");
  assert.ok(help.href.endsWith("/faq/#bantuan"), help.href);

  const nav = footer.match(/<nav[^>]*aria-label=["']?Footer["']?[^>]*>/i);
  assert.ok(nav, "footer must render the Footer navigation");
  assert.ok(
    footer.indexOf("Butuh bantuan sekarang?") < nav.index,
    "help line must appear before the footer menu",
  );
});

test("rendered footer has legal links and Indonesian legal copy", () => {
  const footer = footerHtml();
  const links = anchors(footer);

  const privacy = links.find((link) => link.text === "Privasi");
  assert.ok(privacy, "footer must link Privasi");
  assert.ok(privacy.href.endsWith("/privacy/"), privacy.href);

  const services = links.find((link) => link.text === "Layanan Konsulin");
  assert.ok(services, "footer must link Layanan Konsulin");
  assert.ok(services.href.endsWith("/feature/"), services.href);

  assert.ok(footer.includes("Hak cipta dilindungi."), "footer must use Indonesian copyright copy");
  assert.ok(!footer.includes("All rights reserved"), "footer must not keep English copyright copy");
});
