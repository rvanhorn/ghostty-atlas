import { test } from "vitest";
import assert from "node:assert/strict";
import { loadUpstreamThemes } from "../scripts/theme-source.js";

const revision = "a".repeat(40);
const listing = {
  sha: revision,
  tree: [
    { type: "blob", path: "ghostty/Theme With Spaces" },
    { type: "blob", path: "ghostty/Theme #2" },
    { type: "blob", path: "other/Ignore" },
    { type: "tree", path: "ghostty" },
  ],
};

test("refresh downloads only Ghostty files from one immutable revision", async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return url.includes("api.github.com")
      ? Response.json(listing)
      : new Response("background = #191c24\nforeground = #ffffff\n");
  };
  const result = await loadUpstreamThemes(fetcher);
  assert.equal(result.revision, revision);
  assert.deepEqual(
    result.sources.map(({ name }) => name),
    ["Theme With Spaces", "Theme #2"],
  );
  assert.ok(urls[1].includes(`/${revision}/ghostty/Theme%20With%20Spaces`));
  assert.ok(urls[2].endsWith("Theme%20%232"));
});

test("refresh rejects incomplete listings and download failures", async () => {
  for (const snapshot of [
    { ...listing, truncated: true },
    { ...listing, sha: "invalid" },
    { ...listing, tree: [] },
  ]) {
    await assert.rejects(
      loadUpstreamThemes(async () => Response.json(snapshot)),
    );
  }
  await assert.rejects(
    loadUpstreamThemes(async (url) =>
      url.includes("api.github.com")
        ? Response.json(listing)
        : new Response("Unavailable", { status: 503 }),
    ),
    /Theme download failed \(503\)/,
  );
});
