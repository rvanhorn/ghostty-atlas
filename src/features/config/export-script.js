export const SCRIPT_FILENAME = "ghostty-atlas.sh";
export const SCRIPT_COMMAND = `sh "$HOME/Downloads/${SCRIPT_FILENAME}"`;

export const createConfigScript = (source) => {
  let delimiter = "GHOSTTY_ATLAS_CONFIG";
  const lines = source.split(/\r?\n/);
  while (lines.includes(delimiter)) delimiter += "_";
  return `#!/bin/sh
# Install the configuration exported from Ghostty Atlas.
set -eu
umask 077

config_dir="\${XDG_CONFIG_HOME:-$HOME/.config}/ghostty"
if [ "$(uname -s)" = "Darwin" ]; then
  config_dir="$HOME/Library/Application Support/com.mitchellh.ghostty"
fi
mkdir -p "$config_dir"
config_path="$config_dir/config.ghostty"
if [ -f "$config_dir/config" ]; then
  config_path="$config_dir/config"
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
