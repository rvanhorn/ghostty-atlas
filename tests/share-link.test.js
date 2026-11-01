/* Issue #2, "Share theme selections and comparisons through links": links name themes
   rather than catalog numbers, keep the deployed path, leave config contents out, and
   report malformed or unknown parts of a link instead of failing. */
import { test } from "vitest";
import assert from "node:assert/strict";
import { getThemeNumber } from "../src/shared/theme-catalog.js";
import {
  createShareUrl,
  describeIgnored,
  parseShareLink,
  removeShareParams,
} from "../src/features/share/share-link.js";

const pagesHref =
  "https://rvanhorn.github.io/ghostty-atlas/?copies=2#theme-catalog";

test("single-theme and comparison links round-trip by theme name at the Pages path", () => {
  const single = createShareUrl(pagesHref, {
    comparing: false,
    theme: "Black Metal (Bathory)",
    sample: "code",
  });
  assert.equal(
    single,
    "https://rvanhorn.github.io/ghostty-atlas/?theme=Black+Metal+%28Bathory%29&sample=code",
  );
  assert.deepEqual(parseShareLink(new URL(single).search), {
    comparing: false,
    theme: "Black Metal (Bathory)",
    left: null,
    right: null,
    sample: "code",
    ignored: [],
  });

  const comparison = createShareUrl(pagesHref, {
    comparing: true,
    left: "Nord",
    right: "Dracula",
    sample: "text",
  });
  assert.equal(
    comparison,
    "https://rvanhorn.github.io/ghostty-atlas/?left=Nord&right=Dracula&sample=text",
  );
  assert.deepEqual(parseShareLink(new URL(comparison).search), {
    comparing: true,
    theme: null,
    left: "Nord",
    right: "Dracula",
    sample: "text",
    ignored: [],
  });
});

// Issue #6, "Add representative terminal preview samples": the new samples are shareable.
test("the ANSI, Git diff, dense log, and terminal UI samples round-trip in links", () => {
  for (const sample of ["ansi", "diff", "log", "tui"]) {
    const link = createShareUrl(pagesHref, {
      comparing: true,
      left: "Nord",
      right: "Dracula",
      sample,
    });
    const parsed = parseShareLink(new URL(link).search);
    assert.equal(parsed.sample, sample);
    assert.deepEqual(parsed.ignored, []);
  }
});

test("catalog numbers and unknown names are ignored and named for the user", () => {
  const number = String(getThemeNumber("Nord"));
  const result = parseShareLink(`?theme=%23${number}&sample=video`);
  assert.equal(result.theme, null);
  assert.equal(result.sample, null);
  assert.equal(
    describeIgnored(result.ignored),
    `Part of the shared link was ignored: unknown theme “#${number}”; unknown preview sample “video”.`,
  );
});

test("a comparison keeps its valid side and reports the rest", () => {
  const result = parseShareLink(
    "?left=Nord&right=Not%20A%20Theme&theme=Dracula&left=Dracula",
  );
  assert.equal(result.comparing, true);
  assert.equal(result.left, "Nord");
  assert.equal(result.right, null);
  assert.equal(result.theme, null);
  assert.deepEqual(result.ignored, [
    "repeated “left” values",
    "unknown right theme “Not A Theme”",
    "“theme”, because the link compares two themes",
  ]);

  const unusable = parseShareLink("?left=&right");
  assert.equal(unusable.comparing, false);
  assert.deepEqual(unusable.ignored, ["empty left theme", "empty right theme"]);
});

test("malformed encoding and long values do not throw", () => {
  const result = parseShareLink(`?theme=%E0%A4%A&sample=${"x".repeat(500)}`);
  assert.equal(result.theme, null);
  assert.equal(result.ignored.length, 2);
  assert.ok(result.ignored[1].length < 100);
  assert.equal(parseShareLink("?copies=2"), null);
  assert.equal(parseShareLink(""), null);
});

test("reading a link removes only the shared values from the address", () => {
  assert.equal(
    removeShareParams(
      "https://rvanhorn.github.io/ghostty-atlas/?copies=2&left=Nord&right=Dracula&sample=code#top",
    ),
    "/ghostty-atlas/?copies=2#top",
  );
});
