/* Platform and version notes for settings Atlas can explain, each traced to Ghostty's
   documentation. The target is the user's choice; Atlas never detects an installation.
   Settings without an entry are kept as written and are not checked. */
const reference = "https://ghostty.org/docs/config/reference";
const releaseNotes = "https://ghostty.org/docs/install/release-notes";
const optionDocs = (key) => `${reference}#${key}`;
const notes11 = `${releaseNotes}/1-1-0`;
const notes12 = `${releaseNotes}/1-2-0`;
const notes14 = `${releaseNotes}/1-4-0`;

export const targetPlatforms = [
  ["macos", "macOS"],
  ["linux", "Linux"],
];

// Release series listed in Ghostty's release notes, newest first.
export const ghosttyVersions = ["1.4", "1.3", "1.2", "1.1", "1.0"];

export const defaultTarget = { platform: "macos", version: ghosttyVersions[0] };

export const platformLabel = (platform) =>
  targetPlatforms.find(([id]) => id === platform)?.[1] ?? platform;

const applyMessages = {
  restart: "Changes require restarting Ghostty completely.",
  "new-windows": "Changes apply to new windows.",
  "new-terminals":
    "Changes apply to new terminals, such as new windows, tabs, and splits.",
  "directory-change":
    "Open windows update after their working directory changes.",
};

const ghosttyThemeOnly = {
  platforms: ["linux"],
  text: "Takes effect only with window-theme = ghostty.",
};

/* Each entry may have:
   - platforms: the platforms that use the setting (every platform when omitted).
   - since: the first release series with the setting, or one per platform.
   - applies: an applyMessages id, or one per platform, for when changes take effect.
   - notes: [{ platforms, since, before, level, text, source }] for other documented
     caveats, shown from `since` and up to `before` when given.
   - values: [{ values, platforms, since, deprecatedIn, changedIn, text, source }] for
     individual values; `source` defaults to the setting's own documentation. */
export const settingCompatibility = {
  "background-opacity": {
    source: optionDocs("background-opacity"),
    applies: { macos: "restart" },
  },
  "background-blur": {
    source: optionDocs("background-blur"),
    notes: [
      {
        platforms: ["linux"],
        text: "Works only on some Linux desktop environments.",
      },
    ],
  },
  "window-padding-x": {
    source: optionDocs("window-padding-x"),
    applies: "new-terminals",
  },
  "window-padding-y": {
    source: optionDocs("window-padding-y"),
    applies: "new-terminals",
  },
  "scrollback-limit": {
    source: optionDocs("scrollback-limit"),
    applies: "new-terminals",
    notes: [
      {
        since: "1.4",
        level: "deprecated",
        text: "Renamed scrollback-limit-bytes in Ghostty 1.4; the old name still works.",
        source: notes14,
      },
    ],
  },
  "copy-on-select": {
    source: optionDocs("copy-on-select"),
    values: [
      {
        values: ["none", "primary", "both"],
        since: "1.4",
        source: notes14,
      },
      {
        values: ["true", "false"],
        deprecatedIn: "1.4",
        text: "Deprecated in Ghostty 1.4: use primary on Linux or clipboard on macOS instead of true, and none instead of false.",
        source: notes14,
      },
      {
        values: ["clipboard"],
        changedIn: "1.4",
        text: "From Ghostty 1.4, clipboard copies only to the system clipboard; both keeps the earlier behavior.",
        source: notes14,
      },
    ],
  },
  "macos-titlebar-style": {
    source: optionDocs("macos-titlebar-style"),
    platforms: ["macos"],
    applies: "new-windows",
  },
  "window-theme": {
    source: optionDocs("window-theme"),
    values: [{ values: ["ghostty"], platforms: ["linux"] }],
  },
  "window-decoration": {
    source: optionDocs("window-decoration"),
    values: [
      { values: ["auto"], since: "1.1", source: notes11 },
      { values: ["client", "server"], since: "1.1" },
    ],
    notes: [
      {
        platforms: ["linux"],
        text: "Server-side decorations need X11, or a Wayland compositor that supports them, such as KDE Plasma; otherwise Ghostty draws its own.",
      },
    ],
  },
  "window-title-font-family": {
    source: optionDocs("window-title-font-family"),
    since: { macos: "1.0", linux: "1.1" },
  },
  "macos-window-shadow": {
    source: optionDocs("macos-window-shadow"),
    platforms: ["macos"],
  },
  "gtk-titlebar": {
    source: optionDocs("gtk-titlebar"),
    platforms: ["linux"],
  },
  "gtk-titlebar-style": {
    source: optionDocs("gtk-titlebar-style"),
    platforms: ["linux"],
    values: [{ values: ["tabs"], since: "1.2", source: notes12 }],
  },
  "gtk-titlebar-hide-when-maximized": {
    source: optionDocs("gtk-titlebar-hide-when-maximized"),
    platforms: ["linux"],
    since: "1.1",
  },
  "gtk-tabs-location": {
    source: optionDocs("gtk-tabs-location"),
    platforms: ["linux"],
    values: [
      {
        values: ["hidden"],
        deprecatedIn: "1.2",
        text: "Deprecated in Ghostty 1.2: use window-show-tab-bar = never instead.",
        source: notes12,
      },
    ],
  },
  "gtk-wide-tabs": {
    source: optionDocs("gtk-wide-tabs"),
    platforms: ["linux"],
  },
  "gtk-toolbar-style": {
    source: optionDocs("gtk-toolbar-style"),
    platforms: ["linux"],
    since: "1.2",
    notes: [
      {
        platforms: ["linux"],
        before: "1.2",
        text: "Earlier versions call this setting adw-toolbar-style.",
        source: notes12,
      },
    ],
  },
  "window-show-tab-bar": {
    source: optionDocs("window-show-tab-bar"),
    platforms: ["linux"],
    since: "1.2",
  },
  "window-subtitle": {
    source: optionDocs("window-subtitle"),
    platforms: ["linux"],
    since: "1.1",
  },
  "window-titlebar-background": {
    source: optionDocs("window-titlebar-background"),
    platforms: ["linux"],
    notes: [ghosttyThemeOnly],
  },
  "window-titlebar-foreground": {
    source: optionDocs("window-titlebar-foreground"),
    platforms: ["linux"],
    notes: [ghosttyThemeOnly],
  },
  "macos-window-buttons": {
    source: optionDocs("macos-window-buttons"),
    platforms: ["macos"],
    since: "1.2",
    applies: "new-windows",
  },
  "macos-titlebar-proxy-icon": {
    source: optionDocs("macos-titlebar-proxy-icon"),
    platforms: ["macos"],
    applies: "directory-change",
  },
  "macos-option-as-alt": {
    source: optionDocs("macos-option-as-alt"),
    platforms: ["macos"],
  },
};

const seriesNumber = (version) => {
  const [major, minor] = version.split(".").map(Number);
  return major * 1000 + minor;
};
export const isAtLeast = (version, since) =>
  seriesNumber(version) >= seriesNumber(since);
const forPlatform = (value, platform) =>
  typeof value === "object" && value !== null ? value[platform] : value;
const onlyOn = (platforms) =>
  `${platforms.map(platformLabel).join(" and ")} only.`;

/* Findings for one setting's values on a target, as { level, text, source }:
   "unsupported" when Ghostty on that target does not support the setting or value,
   "deprecated" when it still works but has a documented replacement,
   "info" for platform scope, caveats, and when changes take effect.
   A setting left at Ghostty's default (no values) is only informational. */
export const checkSetting = (key, values, target) => {
  const entry = settingCompatibility[key];
  if (!entry) return [];
  const { platform, version } = target;
  const findings = [];
  const add = (level, text, source = entry.source) =>
    findings.push({ level, text, source });
  const unsupported = values.length ? "unsupported" : "info";
  if (entry.platforms) {
    if (!entry.platforms.includes(platform))
      add(
        unsupported,
        `Not used on ${platformLabel(platform)}; ${onlyOn(entry.platforms)}`,
      );
    else add("info", onlyOn(entry.platforms));
  }
  const since = forPlatform(entry.since, platform);
  if (since && !isAtLeast(version, since))
    add(
      unsupported,
      `Requires Ghostty ${since} or later on ${platformLabel(platform)}.`,
    );
  (entry.values ?? []).forEach((rule) => {
    const used = values.filter((value) => rule.values.includes(value));
    if (!used.length) return;
    const quoted = used.map((value) => `“${value}”`).join(", ");
    const source = rule.source ?? entry.source;
    if (rule.platforms && !rule.platforms.includes(platform))
      add(
        "unsupported",
        `${quoted} is not available on ${platformLabel(platform)}; ${onlyOn(rule.platforms)}`,
        source,
      );
    if (rule.since && !isAtLeast(version, rule.since))
      add(
        "unsupported",
        `${quoted} requires Ghostty ${rule.since} or later.`,
        source,
      );
    if (rule.deprecatedIn && isAtLeast(version, rule.deprecatedIn))
      add("deprecated", rule.text, source);
    if (rule.changedIn && isAtLeast(version, rule.changedIn))
      add("info", rule.text, source);
  });
  (entry.notes ?? []).forEach((note) => {
    if (note.platforms && !note.platforms.includes(platform)) return;
    if (note.since && !isAtLeast(version, note.since)) return;
    if (note.before && isAtLeast(version, note.before)) return;
    add(note.level ?? "info", note.text, note.source);
  });
  const applies = forPlatform(entry.applies, platform);
  if (applies && (!entry.platforms || entry.platforms.includes(platform)))
    add("info", applyMessages[applies]);
  return findings;
};

/* Compatibility for a whole config: problems for every setting it contains, and
   timing and caveats only for the settings that changed. Read-only: every directive,
   including unknown ones, stays in the config exactly as written. */
export const checkDocument = (document, target, changedKeys = []) => {
  const keys = new Set([
    ...document.lines.map((line) => line.key).filter(Boolean),
    ...document.edits.keys(),
  ]);
  return [...keys].flatMap((key) => {
    const values = document.values(key);
    if (!values.length) return [];
    const findings = checkSetting(key, values, target).filter(
      (finding) => finding.level !== "info" || changedKeys.includes(key),
    );
    return findings.length ? [{ key, findings }] : [];
  });
};
