import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.join(import.meta.dirname, "..");

const GROUP_IDS = [
  "tentang-gerakan",
  "ikut-serta",
  "data-dan-privasi",
  "risetnya",
  "konsulin",
  "laporan-dan-bantuan",
  "terlibat-lebih-jauh",
];

let cached;

function build() {
  if (cached) return cached;
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "faq-"));
  const r = spawnSync("hugo", ["--minify", "--destination", dest], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 60000,
  });
  cached = { dest, r, out: `${r.stdout}${r.stderr}` };
  return cached;
}

function faqHtml() {
  const { dest } = build();
  return fs.readFileSync(path.join(dest, "faq/index.html"), "utf8");
}

test("faq page builds with no Hugo warnings", () => {
  const { r, out } = build();
  assert.equal(r.status, 0, out);
  assert.ok(!/WARN/.test(out), out);
});

test("faq renders the seven group headings with ids in order", () => {
  const html = faqHtml();
  const ids = [...html.matchAll(/<h2[^>]*\sid=(?:"([^"]+)"|([^\s>]+))/g)].map(
    (m) => m[1] ?? m[2],
  );
  assert.deepEqual(ids, GROUP_IDS);
});

test("faq renders 32 question buttons wired to answers present in the source", () => {
  const html = faqHtml();
  const buttons = [...html.matchAll(/<button[^>]*data-faq-question[^>]*>/g)].map(
    (m) => m[0],
  );
  assert.equal(buttons.length, 32);

  const controls = new Set();
  for (const button of buttons) {
    assert.match(button, /type="?button"?/, button);
    assert.match(button, /aria-expanded=(?:"false"|false)/, button);
    assert.match(button, /:aria-expanded=/, button);
    const match = button.match(/aria-controls=(?:"([^"]+)"|([^\s>]+))/);
    assert.ok(match, button);
    const answerId = match[1] ?? match[2];
    assert.ok(!controls.has(answerId), `duplicate answer id ${answerId}`);
    controls.add(answerId);

    const answer = html.match(
      new RegExp(`<div[^>]*\\sid=(?:"${answerId}"|${answerId}(?=[\\s>]))[^>]*>`),
    );
    assert.ok(answer, `missing answer element ${answerId}`);
    assert.match(answer[0], /x-show=(?:"open"|open)/, answer[0]);
  }
  assert.equal(controls.size, 32);
  assert.ok(!/x-cloak/.test(html), "answers must stay readable without JS");
});

test("faq source has no bracket placeholders and renders the real contacts", () => {
  const source = fs.readFileSync(path.join(ROOT, "content/faq.md"), "utf8");
  const withoutLinks = source.replace(/\[[^\]]*\]\([^)]*\)/g, "");
  assert.ok(
    !/[\[\]]/.test(withoutLinks),
    "content/faq.md still contains a bracket placeholder",
  );
  assert.ok(!/\[email peneliti\]|\[nomor hotline\]|\[kontak biro\]/.test(source));

  const html = faqHtml();
  assert.ok(html.includes("aly.lamuri@ui.ac.id"));
  assert.match(html, /href="?mailto:aly\.lamuri@ui\.ac\.id"?/);
  assert.ok(html.includes("119 ekstensi 8"));
  assert.ok(html.includes("wa.me/6285156410912"));
});
