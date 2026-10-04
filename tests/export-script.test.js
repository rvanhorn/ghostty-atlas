import assert from "node:assert/strict";
import { test } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createConfigScript } from "../src/features/config/export-script.js";

test("install script treats config as data and backs up the existing file", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-script-"));
  try {
    const bin = join(root, "bin");
    const configRoot = join(root, "config with spaces");
    const configDir = join(configRoot, "ghostty");
    mkdirSync(bin);
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(bin, "uname"), "#!/bin/sh\nprintf 'Linux\\n'\n", {
      mode: 0o755,
    });
    writeFileSync(join(configDir, "config"), "previous config\n");
    const marker = join(root, "injected");
    const source = `# $(touch "${marker}")\nGHOSTTY_ATLAS_CONFIG\ntheme = Dracula\n`;
    const script = join(root, "install.sh");
    writeFileSync(script, createConfigScript(source));
    const result = spawnSync("sh", [script], {
      env: {
        ...process.env,
        XDG_CONFIG_HOME: configRoot,
        PATH: `${bin}:${process.env.PATH}`,
      },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(configDir, "config"), "utf8"), source);
    const backup = readdirSync(configDir).find((name) =>
      name.startsWith("config.backup."),
    );
    assert.equal(
      readFileSync(join(configDir, backup), "utf8"),
      "previous config\n",
    );
    assert.ok(!readdirSync(root).includes("injected"));
    assert.ok(
      !readdirSync(configDir).some((name) => name.startsWith(".atlas.")),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
