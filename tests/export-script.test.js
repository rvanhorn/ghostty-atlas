/* Install script contract: config text is data, the existing file is backed up, and
   (issue #13) the script installs where Ghostty reads config on macOS and Linux:
   https://ghostty.org/docs/config#file-location */
import assert from "node:assert/strict";
import { test } from "vitest";
import {
  existsSync,
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

// Runs the script with a fake `uname` for the system, HOME and XDG_CONFIG_HOME in a
// temporary folder, and passes the folder paths to `check`.
const runScript = (system, source, version, prepare, check) => {
  const root = mkdtempSync(join(tmpdir(), "atlas-script-"));
  try {
    const bin = join(root, "bin");
    const home = join(root, "home");
    const xdgRoot = join(root, "config with spaces");
    const paths = {
      root,
      xdgDir: join(xdgRoot, "ghostty"),
      macDir: join(
        home,
        "Library",
        "Application Support",
        "com.mitchellh.ghostty",
      ),
    };
    mkdirSync(bin);
    mkdirSync(home);
    writeFileSync(join(bin, "uname"), `#!/bin/sh\nprintf '${system}\\n'\n`, {
      mode: 0o755,
    });
    prepare(paths);
    const script = join(root, "install.sh");
    writeFileSync(script, createConfigScript(source, version));
    const result = spawnSync("sh", [script], {
      cwd: root,
      env: {
        ...process.env,
        HOME: home,
        XDG_CONFIG_HOME: xdgRoot,
        PATH: `${bin}:${process.env.PATH}`,
      },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    check(paths);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test("install script treats config as data and backs up the existing file", () => {
  const marker = "injected";
  runScript(
    "Linux",
    `# $(touch "${marker}")\nGHOSTTY_ATLAS_CONFIG\ntheme = Dracula\n`,
    "1.4",
    ({ xdgDir }) => {
      mkdirSync(xdgDir, { recursive: true });
      writeFileSync(join(xdgDir, "config"), "previous config\n");
    },
    ({ root, xdgDir }) => {
      assert.equal(
        readFileSync(join(xdgDir, "config"), "utf8"),
        `# $(touch "${marker}")\nGHOSTTY_ATLAS_CONFIG\ntheme = Dracula\n`,
      );
      const backup = readdirSync(xdgDir).find((name) =>
        name.startsWith("config.backup."),
      );
      assert.equal(
        readFileSync(join(xdgDir, backup), "utf8"),
        "previous config\n",
      );
      assert.ok(!readdirSync(root).includes(marker));
      assert.ok(
        !readdirSync(xdgDir).some((name) => name.startsWith(".atlas.")),
      );
      assert.ok(!readdirSync(xdgDir).includes("config.ghostty"));
    },
  );
});

test("a new config uses the file name the target Ghostty version reads", () => {
  // config.ghostty from Ghostty 1.2.3; earlier versions read only config.
  runScript(
    "Linux",
    "theme = Nord\n",
    "1.4",
    () => {},
    ({ xdgDir }) =>
      assert.equal(
        readFileSync(join(xdgDir, "config.ghostty"), "utf8"),
        "theme = Nord\n",
      ),
  );
  runScript(
    "Linux",
    "theme = Nord\n",
    "1.2",
    () => {},
    ({ xdgDir }) => {
      assert.equal(
        readFileSync(join(xdgDir, "config"), "utf8"),
        "theme = Nord\n",
      );
      assert.ok(!existsSync(join(xdgDir, "config.ghostty")));
    },
  );
});

test("on macOS the script replaces an XDG config rather than overriding it", () => {
  runScript(
    "Darwin",
    "theme = Nord\n",
    "1.4",
    ({ xdgDir }) => {
      mkdirSync(xdgDir, { recursive: true });
      writeFileSync(join(xdgDir, "config.ghostty"), "previous config\n");
    },
    ({ xdgDir, macDir }) => {
      assert.equal(
        readFileSync(join(xdgDir, "config.ghostty"), "utf8"),
        "theme = Nord\n",
      );
      assert.ok(!existsSync(macDir));
    },
  );
  // Without any config, macOS uses its Application Support folder.
  runScript(
    "Darwin",
    "theme = Nord\n",
    "1.4",
    () => {},
    ({ xdgDir, macDir }) => {
      assert.equal(
        readFileSync(join(macDir, "config.ghostty"), "utf8"),
        "theme = Nord\n",
      );
      assert.ok(!existsSync(xdgDir));
    },
  );
});
