import { test } from "vitest";
import assert from "node:assert/strict";
import { fields } from "../src/features/config/fields.js";
import {
  getPreviewRequirement,
  previewSupport,
} from "../src/features/config/preview-support.js";
import {
  getConfigurationPreview,
  getWindowAppearance,
} from "../src/features/config/preview.js";
import {
  configReducer,
  createConfigState,
} from "../src/features/config/config-state.js";
import {
  adjustContrast,
  contrastRatio,
  resolveWindowAppearance,
} from "../src/features/config/contrast.js";
import { balancedPadding } from "../src/features/config/use-preview-metrics.js";
import { themes } from "../src/data/themes.js";

const examples = {
  "font-family": [
    "Arial\nCourier New",
    "fontFamily",
    '"Arial", "Courier New", "Geist Mono", monospace',
  ],
  "font-size": ["8", "fontSize", 8],
  "minimum-contrast": ["7", "minimumContrast", 7],
  "background-opacity": ["0.3", "opacity", 0.3],
  "background-blur": ["true", "blur", 20],
  "window-padding-x": ["100,120", "padding", "20px 120px 20px 100px"],
  "window-padding-y": ["0,90", "padding", "0px 20px 90px 20px"],
  "window-padding-balance": ["true", "balance", true],
  "cursor-style": ["underline", "cursor", "underline"],
  "cursor-style-blink": ["false", "blink", false],
  "macos-titlebar-style": ["hidden", "titlebar", "hidden"],
  "window-theme": ["light", "windowAppearance", "light"],
  "window-title-font-family": ["Arial", "titleFont", '"Arial"'],
  "macos-window-buttons": ["hidden", "hideButtons", true],
  "macos-titlebar-proxy-icon": ["hidden", "hideProxy", true],
  "window-decoration": ["none", "hideDecoration", true],
  "gtk-titlebar": ["false", "gtkTitlebar", false],
  "gtk-titlebar-style": ["tabs", "gtkTitlebarStyle", "tabs"],
  "window-show-tab-bar": ["never", "tabBar", "never"],
  "gtk-tabs-location": ["bottom", "tabsLocation", "bottom"],
  "gtk-wide-tabs": ["false", "wideTabs", false],
  "gtk-toolbar-style": ["flat", "toolbarStyle", "flat"],
  "window-subtitle": ["working-directory", "subtitle", true],
  "window-titlebar-background": ["1E1E2E", "titlebarBackground", "#1e1e2e"],
  "window-titlebar-foreground": ["#cdd6f4", "titlebarForeground", "#cdd6f4"],
};

test("every exposed setting has an explicit preview contract", () => {
  assert.deepEqual(
    Object.keys(previewSupport).sort(),
    fields.map(({ key }) => key).sort(),
  );
  assert.deepEqual(
    Object.keys(examples).sort(),
    fields
      .filter(({ key }) => previewSupport[key].mode === "visual")
      .map(({ key }) => key)
      .sort(),
  );
});
for (const field of fields) {
  test(`${field.key}: valid edit exports and preview/reset follow its contract`, () => {
    const initial = createConfigState();
    const support = previewSupport[field.key];
    const [value, property, expected] = examples[field.key] || [
      field.options?.find(([v]) => v)?.[0] || "1000",
    ];
    const edited = configReducer(initial, { type: "field", field, value });
    assert.deepEqual(edited.errors, {});
    assert.ok(edited.document.export().includes(`${field.key} =`));
    if (support.mode === "visual")
      assert.equal(
        getConfigurationPreview(edited.document)[property],
        expected,
      );
    else {
      assert.match(support.note, /Applies in Ghostty/);
      assert.deepEqual(
        getConfigurationPreview(edited.document),
        getConfigurationPreview(initial.document),
      );
    }
    const reset = configReducer(edited, { type: "reset", keys: [field.key] });
    assert.equal(reset.document.export(), initial.document.export());
    assert.deepEqual(
      getConfigurationPreview(reset.document),
      getConfigurationPreview(initial.document),
    );
  });
}

test("contrast correction meets attainable ratios across the catalog without mutating theme colors", () => {
  for (const theme of themes) {
    for (const color of [theme.fg, ...theme.palette]) {
      assert.equal(adjustContrast(color, theme.bg, 1), color);
      const attainable = Math.max(
        contrastRatio("#ffffff", theme.bg),
        contrastRatio("#000000", theme.bg),
      );
      const adjusted = adjustContrast(color, theme.bg, 7);
      assert.ok(
        contrastRatio(adjusted, theme.bg) >= Math.min(7, attainable) - 0.00001,
      );
    }
  }
});

test("window appearance follows system and titlebar precedence", () => {
  assert.equal(
    resolveWindowAppearance("system", "#ffffff", "native", true),
    "dark",
  );
  assert.equal(
    resolveWindowAppearance("system", "#000000", "native", false),
    "light",
  );
  assert.equal(
    resolveWindowAppearance("auto", "#ffffff", "native", true),
    "light",
  );
  assert.equal(
    resolveWindowAppearance("light", "#000000", "transparent", false),
    "dark",
  );
  assert.equal(
    resolveWindowAppearance("dark", "#ffffff", "tabs", true),
    "light",
  );
});

/* Issue #13: the preview target is explicit, and Linux does not use macOS titlebar
   dependencies. window-theme = ghostty is Linux only; on Linux, macos-titlebar-style
   does not decide the window appearance or disable shared controls. */
test("the Linux preview ignores macOS titlebar rules and alone draws Ghostty colors", () => {
  const document = createConfigState(
    "macos-titlebar-style = transparent\nwindow-theme = light\n",
  ).document;
  const preview = getConfigurationPreview(document);
  assert.equal(
    getWindowAppearance(preview, "linux", "#000000", false),
    "light",
  );
  assert.equal(getWindowAppearance(preview, "macos", "#000000", false), "dark");
  const ghostty = getConfigurationPreview(
    createConfigState("window-theme = ghostty\n").document,
  );
  assert.equal(
    getWindowAppearance(ghostty, "linux", "#000000", false),
    "ghostty",
  );
  assert.notEqual(
    getWindowAppearance(ghostty, "macos", "#000000", false),
    "ghostty",
  );

  const hidden = createConfigState(
    "macos-titlebar-style = hidden\nwindow-theme = dark\n",
  ).document;
  for (const key of ["window-theme", "window-title-font-family"]) {
    assert.ok(getPreviewRequirement(key, hidden, "macos"));
    assert.equal(getPreviewRequirement(key, hidden, "linux"), undefined);
  }
  // Titlebar colors depend on window-theme = ghostty on every platform.
  assert.ok(
    getPreviewRequirement("window-titlebar-background", hidden, "linux"),
  );
  assert.equal(
    getPreviewRequirement(
      "window-titlebar-background",
      createConfigState("window-theme = ghostty\n").document,
      "linux",
    ),
    undefined,
  );
});

test("unset preview values follow installed macOS Ghostty defaults", () => {
  const preview = getConfigurationPreview(createConfigState("").document);
  assert.equal(preview.fontSize, 13);
  assert.equal(preview.padding, "2px 2px 2px 2px");
  assert.equal(preview.titlebar, "transparent");
  assert.equal(preview.blink, true);
});

test("balanced padding shares only leftover cell space without changing explicit asymmetry", () => {
  assert.deepEqual(
    balancedPadding([10, 20, 30, 40], 167, 101, 10, 20),
    [10.5, 23.5, 30.5, 43.5],
  );
  assert.deepEqual(
    balancedPadding([10, 20, 30, 40], 160, 100, 10, 20),
    [10, 20, 30, 40],
  );
});
