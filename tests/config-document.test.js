import assert from "node:assert/strict";
import { test } from "vitest";
import { ConfigDocument } from "../src/features/config/config-document.js";
test("configuration imports preserve bytes through edits, undo, and resets", () => {
  const source =
    '# Keep this comment\r\ntheme = "Neutron"\r\nfont-size=12\r\nfont-size = 14\r\nfont-family = Fira Code\r\nfont-family = Symbols Nerd Font\r\nkeybind = ctrl+a=first\r\nkeybind = ctrl+b=second\r\nenv = TEST=a=b#literal\r\nconfig-file = ?local.conf';
  const doc = new ConfigDocument(source);
  assert.equal(
    doc.export(),
    source,
    "Untouched imports are byte-for-byte identical",
  );
  assert.equal(doc.get("theme"), "Neutron");
  assert.equal(doc.get("font-size"), "14");
  assert.deepEqual(doc.values("font-family"), [
    "Fira Code",
    "Symbols Nerd Font",
  ]);
  doc.set("font-size", "16");
  assert.equal(new ConfigDocument(doc.export()).get("font-size"), "16");
  assert.equal((doc.export().match(/font-size/g) || []).length, 1);
  assert.ok(doc.export().includes("env = TEST=a=b#literal\r\n"));
  assert.ok(doc.export().endsWith("config-file = ?local.conf"));
  doc.set("font-size", "14");
  assert.equal(doc.export(), source, "Undo restores exact original");
  doc.set("font-family", ["JetBrains Mono", "Noto Sans"]);
  assert.deepEqual(new ConfigDocument(doc.export()).values("font-family"), [
    "JetBrains Mono",
    "Noto Sans",
  ]);
  assert.ok(
    doc.export().includes("font-family =\r\nfont-family = JetBrains Mono"),
  );
  doc.set("font-family", []);
  assert.equal(new ConfigDocument(doc.export()).get("font-family"), "");
  assert.throws(() => doc.set("font-size", "14\ncommand = dangerous"));
  const empty = new ConfigDocument("");
  empty.set("font-size", "14");
  assert.equal(empty.export(), "font-size = 14\n");
  const noNewline = new ConfigDocument("theme = Neutron");
  noNewline.set("font-size", "14");
  assert.equal(noNewline.export(), "theme = Neutron\nfont-size = 14\n");
  const reset = new ConfigDocument(
    'font-family = First\nfont-family = ""\nfont-family = Last',
  );
  assert.deepEqual(reset.values("font-family"), ["Last"]);
});
