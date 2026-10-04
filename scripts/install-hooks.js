import fs from "node:fs";
import { spawnSync } from "node:child_process";

if (fs.existsSync(".git")) {
  const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} else {
  console.log("No Git checkout; skipping local hook installation.");
}
