import { isAtLeast } from "./compatibility.js";

export const SCRIPT_FILENAME = "ghostty-atlas.sh";
export const SCRIPT_COMMAND = `sh "$HOME/Downloads/${SCRIPT_FILENAME}"`;

/* An installer for macOS and Linux. It replaces the config file Ghostty already
   loads last, or creates one where Ghostty looks: config.ghostty from Ghostty 1.2.3,
   config before that (Atlas targets release series, so 1.2 and earlier get config). */
export const createConfigScript = (source, version = "1.4") => {
  let delimiter = "GHOSTTY_ATLAS_CONFIG";
  const lines = source.split(/\r?\n/);
  while (lines.includes(delimiter)) delimiter += "_";
  const newFilename = isAtLeast(version, "1.3") ? "config.ghostty" : "config";
  return `#!/bin/sh
# Install the configuration exported from Ghostty Atlas.
set -eu
umask 077

xdg_dir="\${XDG_CONFIG_HOME:-$HOME/.config}/ghostty"
config_dir="$xdg_dir"
# macOS reads the XDG folder, then its own folder, whose values win. Keep using the
# XDG folder when only it has a config.
if [ "$(uname -s)" = "Darwin" ]; then
  mac_dir="$HOME/Library/Application Support/com.mitchellh.ghostty"
  if [ -f "$mac_dir/config.ghostty" ] || [ -f "$mac_dir/config" ] ||
    { [ ! -f "$xdg_dir/config.ghostty" ] && [ ! -f "$xdg_dir/config" ]; }; then
    config_dir="$mac_dir"
  fi
fi
mkdir -p "$config_dir"
config_path="$config_dir/${newFilename}"
if [ -f "$config_dir/config" ]; then
  config_path="$config_dir/config"
elif [ -f "$config_dir/config.ghostty" ]; then
  config_path="$config_dir/config.ghostty"
fi
temp_path=$(mktemp "$config_dir/.atlas.XXXXXX")
trap 'rm -f "$temp_path"' EXIT HUP INT TERM
cat > "$temp_path" <<'${delimiter}'
${source}${source.endsWith("\n") ? "" : "\n"}${delimiter}
if [ -f "$config_path" ]; then
  backup_path=$(mktemp "$config_path.backup.XXXXXX")
  cp -p "$config_path" "$backup_path"
  printf 'Previous config saved to %s\\n' "$backup_path"
fi
mv "$temp_path" "$config_path"
printf 'Config installed at %s\\nReload Ghostty configuration to apply it.\\n' "$config_path"
`;
};
