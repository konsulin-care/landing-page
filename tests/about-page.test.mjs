import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.join(import.meta.dirname, "..");

const SECTION_IDS = [
  "mulai",
  "siapa",
  "janji",
  "cara-kerja",
  "pendanaan",
  "kontak",
];

const COMMITMENTS = [
  "Data Anda, kendali Anda",
  "Tidak pernah dijual",
  "Terbuka untuk diperiksa",
  "Apa yang Konsulin dapat",
  "Skrining, bukan diagnosis",
  "Nonpartisan",
];

let cached;

function build() {
  if (cached) return cached;
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "about-"));
  const r = spawnSync("hugo", ["--minify", "--destination", dest], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 60000,
  });
  cached = { dest, r, out: `${r.stdout}${r.stderr}` };
  return cached;
}

function aboutHtml() {
  const { dest } = build();
  return fs.readFileSync(path.join(dest, "about/index.html"), "utf8");
}

function sectionIds(html) {
  return [...html.matchAll(/<section\b[^>]*\sid=(?:"([^"]+)"|([^\s>]+))/g)].map(
    (m) => m[1] ?? m[2],
  );
}

function sectionHtml(html, id) {
  const start = html.search(new RegExp(`<section\\b[^>]*\\sid=["']?${id}["'\\s>]`));
  assert.ok(start >= 0, `missing section#${id}`);
  const end = html.indexOf("</section>", start);
  assert.ok(end > start, `unclosed section#${id}`);
  return html.slice(start, end);
}

const stripTags = (value) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

test("about page builds with no Hugo warnings", () => {
  const { r, out } = build();
  assert.equal(r.status, 0, out);
  assert.ok(!/WARN/.test(out), out);
});

test("about renders the six sections in order and no pendukung section", () => {
  const ids = sectionIds(aboutHtml());
  assert.deepEqual(ids, SECTION_IDS);
  assert.ok(!ids.includes("pendukung"));
});

test("every about h2 is followed by non-empty content", () => {
  const html = aboutHtml();
  const headings = [...html.matchAll(/<h2\b[^>]*>[\s\S]*?<\/h2>/g)];
  assert.equal(headings.length, SECTION_IDS.length);

  for (const heading of headings) {
    const bodyStart = heading.index + heading[0].length;
    const bodyEnd = html.indexOf("</section>", bodyStart);
    assert.ok(bodyEnd > bodyStart, `section after ${heading[0]} not closed`);
    const content = stripTags(html.slice(bodyStart, bodyEnd));
    assert.ok(content.length > 0, `empty section after ${heading[0]}`);
  }
});

test("about contains no old product copy and no ethics approval phrase", () => {
  const text = aboutHtml().toLowerCase();
  assert.ok(!text.includes("rekam medis"));
  assert.ok(!text.includes("dasbor pengguna"));
  assert.ok(!text.includes("persetujuan etik"));
});

test("#janji lists the six commitment titles in order", () => {
  const body = sectionHtml(aboutHtml(), "janji");
  let previous = -1;
  for (const title of COMMITMENTS) {
    const index = body.indexOf(title);
    assert.ok(index >= 0, `missing commitment ${title}`);
    assert.ok(index > previous, `commitment out of order: ${title}`);
    previous = index;
  }
});

test("#cara-kerja links to the open-source GitHub organisation", () => {
  const body = sectionHtml(aboutHtml(), "cara-kerja");
  assert.match(body, /href=["']?https:\/\/github\.com\/konsulin-care["'\s>]/);
});
