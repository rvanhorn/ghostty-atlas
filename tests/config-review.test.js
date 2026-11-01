/* Issue #7, "Review config changes and show platform and version compatibility".
   Criteria: change review lists additions, removals and modifications without spurious
   comments or unknown directives, identifies an unchanged document, and survives
   repeated directives and line endings; compatibility guidance cites Ghostty docs,
   follows the chosen platform and version, and never alters the config. */
import assert from "node:assert/strict";
import { test } from "vitest";
import { ConfigDocument } from "../src/features/config/config-document.js";
import {
  reviewChanges,
  summarizeChanges,
} from "../src/features/config/change-review.js";
import {
  checkDocument,
  checkSetting,
} from "../src/features/config/compatibility.js";

const source =
  "# Comment one\r\nfuture-key = keep me\r\nfont-size=12\r\nfont-size = 14\r\npalette = 0=#000000\r\n# Comment two\r\npalette = 1=#111111\r\nfont-family = Fira Code\r\nfont-family = Symbols Nerd Font\r\nbackground = #222222\r\n";

test("change review lists only edited settings across repeated directives and CRLF", () => {
  const document = new ConfigDocument(source);
  document.set("font-size", "16");
  document.set("palette", ["0=#000000", "1=#333333"]);
  document.set("font-family", ["Fira Code", "Noto Sans"]);
  document.remove("background");
  document.set("cursor-style", "bar");
  const changes = reviewChanges(document);
  assert.deepEqual(changes, [
    {
      key: "font-size",
      kind: "modified",
      removed: ["font-size=12", "font-size = 14"],
      added: ["font-size = 16"],
    },
    {
      key: "palette",
      kind: "modified",
      removed: ["palette = 1=#111111"],
      added: ["palette = 1=#333333"],
    },
    {
      key: "font-family",
      kind: "modified",
      removed: ["font-family = Symbols Nerd Font"],
      added: ["font-family =", "font-family = Noto Sans"],
    },
    {
      key: "background",
      kind: "removed",
      removed: ["background = #222222"],
      added: [],
    },
    {
      key: "cursor-style",
      kind: "added",
      removed: [],
      added: ["cursor-style = bar"],
    },
  ]);
  const listed = changes.flatMap((change) => [
    ...change.removed,
    ...change.added,
  ]);
  assert.ok(
    listed.every((line) => !/^#|future-key|\r|\n/.test(line)),
    "Comments, unknown directives and line endings are not changes",
  );
  assert.equal(
    summarizeChanges(changes),
    "5 settings changed: 3 modified, 1 added, 1 removed.",
  );
});

test("an unchanged document, or one edited back, has no changes", () => {
  const document = new ConfigDocument(source);
  assert.deepEqual(reviewChanges(document), []);
  document.set("font-size", "20");
  document.set("font-size", "14");
  assert.deepEqual(reviewChanges(document), []);
  assert.equal(summarizeChanges([]), "No changes.");
});

const levels = (key, values, platform, version) =>
  checkSetting(key, values, { platform, version }).map(
    (finding) => finding.level,
  );

test("compatibility follows the chosen platform and version", () => {
  // A macOS-only setting added in 1.2.
  assert.ok(
    levels("macos-window-buttons", ["hidden"], "linux", "1.4").includes(
      "unsupported",
    ),
  );
  assert.ok(
    levels("macos-window-buttons", ["hidden"], "macos", "1.1").includes(
      "unsupported",
    ),
  );
  assert.ok(
    !levels("macos-window-buttons", ["hidden"], "macos", "1.2").includes(
      "unsupported",
    ),
  );
  // Left at Ghostty's default, a setting cannot be incompatible.
  assert.deepEqual(levels("macos-window-buttons", [], "linux", "1.4"), [
    "info",
  ]);
  // Available on macOS since 1.0 and on Linux since 1.1.
  assert.deepEqual(
    levels("window-title-font-family", ["Inter"], "macos", "1.0"),
    [],
  );
  assert.deepEqual(
    levels("window-title-font-family", ["Inter"], "linux", "1.0"),
    ["unsupported"],
  );
  // Value rules: a Linux-only value, and values changed in 1.4.
  assert.deepEqual(levels("window-theme", ["ghostty"], "macos", "1.4"), [
    "unsupported",
  ]);
  assert.deepEqual(levels("window-theme", ["dark"], "macos", "1.4"), []);
  assert.deepEqual(levels("copy-on-select", ["true"], "linux", "1.4"), [
    "deprecated",
  ]);
  assert.deepEqual(levels("copy-on-select", ["true"], "linux", "1.3"), []);
  assert.deepEqual(levels("copy-on-select", ["primary"], "linux", "1.3"), [
    "unsupported",
  ]);
  // A restart requirement documented for macOS only.
  const opacity = checkSetting("background-opacity", ["0.9"], {
    platform: "macos",
    version: "1.4",
  });
  assert.match(opacity[0].text, /restarting Ghostty/);
  assert.deepEqual(levels("background-opacity", ["0.9"], "linux", "1.4"), []);
  assert.deepEqual(levels("future-key", ["x"], "macos", "1.4"), []);
});

test("every compatibility finding cites Ghostty documentation", () => {
  const targets = ["macos", "linux"].flatMap((platform) =>
    ["1.0", "1.4"].map((version) => ({ platform, version })),
  );
  const samples = {
    "background-opacity": ["0.9"],
    "background-blur": ["true"],
    "scrollback-limit": ["1000"],
    "copy-on-select": ["true", "primary", "clipboard"],
    "macos-titlebar-style": ["tabs"],
    "macos-window-buttons": ["hidden"],
    "macos-titlebar-proxy-icon": ["hidden"],
    "window-theme": ["ghostty"],
    "window-title-font-family": ["Inter"],
  };
  const findings = targets.flatMap((target) =>
    Object.entries(samples).flatMap(([key, values]) =>
      checkSetting(key, values, target),
    ),
  );
  assert.ok(findings.length > 0);
  findings.forEach((finding) =>
    assert.match(finding.source, /^https:\/\/ghostty\.org\/docs\//),
  );
});

test("compatibility guidance keeps every directive and notes timing only for changes", () => {
  const document = new ConfigDocument(
    "# keep\nfuture-key = value\nmacos-window-buttons = hidden\nbackground-opacity = 0.8\n",
  );
  document.set("window-padding-x", "12");
  const exported = document.export();
  const target = { platform: "linux", version: "1.4" };
  const report = checkDocument(document, target, ["window-padding-x"]);
  assert.equal(document.export(), exported, "Checking changes nothing");
  assert.ok(exported.includes("future-key = value\n"));
  assert.ok(exported.includes("macos-window-buttons = hidden\n"));
  assert.deepEqual(
    report.map(({ key, findings }) => [key, findings.map((f) => f.level)]),
    [
      ["macos-window-buttons", ["unsupported"]],
      ["window-padding-x", ["info"]],
    ],
  );
});
