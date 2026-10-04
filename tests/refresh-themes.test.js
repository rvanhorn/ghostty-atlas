import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { format } from "oxfmt";
import { test } from "vitest";

test("refresh formats a local catalog and preserves it when refresh fails", async () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-refresh-"));
  try {
    mkdirSync(join(root, "scripts"));
    mkdirSync(join(root, "src/data"), { recursive: true });
    mkdirSync(join(root, "themes"));
    for (const name of ["refresh-themes.js", "theme-source.js"]) {
      copyFileSync(
        new URL(`../scripts/${name}`, import.meta.url),
        join(root, "scripts", name),
      );
    }
    copyFileSync(
      new URL("../.oxfmtrc.json", import.meta.url),
      join(root, ".oxfmtrc.json"),
    );
    symlinkSync(
      new URL("../node_modules", import.meta.url),
      join(root, "node_modules"),
      "dir",
    );
    writeFileSync(join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      join(root, "themes/Fixture"),
      "background = #191c24\nforeground = #ffffff\n",
    );
    const refresh = () =>
      spawnSync(
        process.execPath,
        [join(root, "scripts/refresh-themes.js"), join(root, "themes")],
        { encoding: "utf8" },
      );
    const result = refresh();
    assert.equal(result.status, 0, result.stderr);
    const outputFile = join(root, "src/data/themes.js");
    const output = readFileSync(outputFile, "utf8");
    const options = JSON.parse(
      readFileSync(join(root, ".oxfmtrc.json"), "utf8"),
    );
    const formatted = await format(outputFile, output, options);
    assert.deepEqual(formatted.errors, []);
    assert.equal(output, formatted.code);
    const { themes, findTheme } = await import(pathToFileURL(outputFile).href);
    assert.equal(themes.length, 1);
    assert.equal(findTheme("Fixture").bg, "#191c24");
    assert.equal(findTheme("Fixture").fg, "#ffffff");
    rmSync(join(root, "themes/Fixture"));
    const failed = refresh();
    assert.notEqual(failed.status, 0);
    assert.match(failed.stderr, /No theme files found/);
    assert.equal(readFileSync(outputFile, "utf8"), output);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
