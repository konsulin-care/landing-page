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

test("faq renders the help item once, above the groups, and not inside a collapsible", () => {
  const html = faqHtml();
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const question = "Saya butuh bantuan sekarang. Ke mana?";
  const occurrences = visible.split(question).length - 1;
  assert.equal(occurrences, 1, "help question must appear exactly once");

  const helpSection = visible.match(
    /<section[^>]*\sid="?bantuan"?[^>]*>[\s\S]*?<\/section>/,
  );
  assert.ok(helpSection, "missing section#bantuan");
  assert.ok(helpSection[0].includes(question), helpSection[0]);
  assert.ok(helpSection[0].includes("119 ekstensi 8"), helpSection[0]);
  assert.ok(
    !/x-show|x-data|x-cloak/.test(helpSection[0]),
    "help answer must be fully visible",
  );

  const helpIndex = visible.search(/id=["']?bantuan[\s"'>]/);
  const firstGroupIndex = visible.search(/id=["']?tentang-gerakan[\s"'>]/);
  assert.ok(helpIndex >= 0, "missing id=bantuan");
  assert.ok(firstGroupIndex >= 0, "missing first group heading");
  assert.ok(
    helpIndex < firstGroupIndex,
    "help section must be placed before the first group",
  );
});

test("faq emits a valid FAQPage JSON-LD block with all 33 questions", () => {
  const html = faqHtml();
  const match = html.match(
    /<script[^>]*type="?application\/ld\+json"?[^>]*>([\s\S]*?)<\/script>/,
  );
  assert.ok(match, "missing application/ld+json script");

  const data = JSON.parse(match[1]);
  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "FAQPage");
  assert.ok(Array.isArray(data.mainEntity), "mainEntity must be an array");
  assert.equal(data.mainEntity.length, 33);

  const questions = data.mainEntity.map((entry) => {
    assert.equal(entry["@type"], "Question");
    assert.equal(typeof entry.name, "string");
    assert.ok(entry.name.length > 0);
    assert.equal(entry.acceptedAnswer["@type"], "Answer");
    assert.equal(typeof entry.acceptedAnswer.text, "string");
    assert.ok(entry.acceptedAnswer.text.length > 0);
    return entry.name;
  });
  assert.ok(
    questions.includes("Saya butuh bantuan sekarang. Ke mana?"),
    "help question must be included in the structured data",
  );
  assert.equal(new Set(questions).size, 33);
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
