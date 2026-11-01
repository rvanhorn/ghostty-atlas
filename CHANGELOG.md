# Changelog

All notable changes to Ghostty Atlas are documented here, grouped by release.

## Unreleased

### Added

- Draft recovery: Atlas keeps the latest unfinished config in this browser's local storage and offers to restore or discard it on return. A restored draft keeps its imported source, comments, unknown directives, line endings, and pending values, and invalid values still block export.
- Named config presets in a new Presets tab of Import / Export. Presets can be saved, loaded, renamed, and deleted; loading a preset over unsaved work offers to save that work as a preset or discard it.
- **Clear Saved Configs** removes the stored draft and presets while keeping bookmarks. Versioned storage records from another Atlas version are left untouched, and unavailable or full storage leaves the editor working without saving.
- **Share** creates a link to the current theme or two-theme comparison with the preview sample, using theme names rather than catalog numbers and keeping the GitHub Pages project path. Links exclude config text, unknown directives, and file names, and a read-only link field stays selected when clipboard access fails.
- Opening a shared link applies its theme, or opens the comparison with its sample, and names any unknown theme, sample, or malformed part it ignored. A stored draft is still offered; restoring it keeps the draft's theme and offers to apply the shared one, and saved presets are untouched.
- **Light & Dark** theme mode configures Ghostty's paired `theme = light:Name,dark:Name` setting. A Light and Dark toggle previews either member, and theme cards set the previewed member. Imported pairs are recognized in either order with surrounding whitespace and stay byte-for-byte unchanged until edited; missing, unlabeled, or uncataloged members are explained while the expression stays as written.
- Switching to **Single Theme** keeps the previewed member, and switching back to **Light & Dark** restores an imported pair exactly or starts a new pair with the current theme on both sides. In pair mode, **Share** links the previewed member.
- A **Palette** settings category edits the background, foreground, cursor, cursor text, selection, selection text, and ANSI 0–15 colors, starting from the previewed theme. Valid hex colors update the preview and its swatches as you type; other text explains what to fix. Changes are saved as Ghostty color settings in the config, so the catalog is unchanged. **Undo**, a reset button on each color, and **Reset All Colors** return to earlier colors or the theme's own.
- **Export Theme File** downloads a Ghostty theme file with the edited colors and explains where to save it and how to reference it with `theme = <name>` or an absolute path. **Import Theme File** applies the colors of a theme file, including one exported from Atlas.
- A palette button on each theme card opens the theme's window colors and labeled ANSI colors 0–15; selecting a color, by pointer or keyboard, copies its hex value.
- **Find Similar Themes** ranks the other themes by how close their background, foreground, and ANSI colors are in the OKLab color space, with ties ordered by name. A **Sort** control in the filter bar also orders themes by background brightness or saturation in either direction. Sorting applies after search and filters narrow the list.
- **ANSI Colors**, **Git Diff**, **Dense Log**, and **Terminal UI** preview samples. The ANSI sample labels all 16 colors, including bright variants, as text, bold text, and background blocks; the others show Git status, diff, and graph colors, leveled log output with a stack trace, and a box-drawn process monitor. Samples use bold, dim, italic, underline, and inverse text, both comparison sides show the same sample, and share links carry the new samples as `ansi`, `diff`, `log`, and `tui`.
- **Review Changes** in the Export tab lists each added, removed, or modified setting with its removed and added lines, compared with the imported or starter config. Comments, unknown directives, untouched settings, and line endings are not listed, and an unchanged config is reported as having no changes.
- A target platform (macOS or Linux) and Ghostty version (1.0 to 1.4), chosen by the user for the session, drive compatibility notes in the review and beside each setting: settings or values the target does not support, deprecated values, and when changes take effect, each linked to Ghostty's documentation. Atlas does not detect the installation and never changes or removes settings because of these notes.

- A **Linux** settings category with GTK titlebar, titlebar style, hide-when-maximized, tab bar visibility and position, wide tabs, bar style, window subtitle, and titlebar colors; **Window Decorations** under a new shared **Window** category; **Window Shadow** under macOS (Config Only); and a Linux-only **Ghostty Colors** choice for Window Appearance. Each new setting's platform, first Ghostty version, and deprecated values are checked for the chosen target and linked to Ghostty's documentation.
- **Randomize** beside the Preview Sample menu picks a different catalog theme and random values for nearly every setting in one step, using the options, practical ranges, and fonts each setting offers for the chosen platform and version. Dependent settings stay coherent, imported comments, unknown directives, and palette colors are kept, and a light and dark pair gets a random light and dark member. **Undo Randomize** steps back one randomization, and **Restore Previous Config** returns to the config before the first one, until another edit ends the run. Font Family and Title & Tab Font fields now suggest common fonts.
- A compact layout for phones, used at 800px and narrower and on touch screens shorter than 520px. A **Settings** button opens the configuration in a side drawer, full width on narrow phones, with a **Category** menu listing all nine categories; edits apply to the preview while it is open and remain after it closes. Escape, the close button, or the backdrop closes it and returns focus to **Settings**, and the page behind it does not scroll. **Share** and **Import / Export** move into a **More Actions** menu, Filter and Compare become icon buttons, the ⌘K hint is hidden on touch screens, and **Preview Sample** sits above the preview.
- **Platform** above the configuration preview switches between macOS and Linux window chrome. It is the same target as **Your Target** in Review Changes. The Linux preview approximates a GNOME window with a close button instead of macOS window buttons, and shows tab position, wide tabs, bar style, subtitle, and Ghostty titlebar colors.

### Changed

- Window Appearance and Title & Tab Font moved from macOS to the shared **Window** category, and Quit After Last Window to **Behavior**. macOS titlebar rules no longer disable them in the Linux preview.
- The installation script, still for macOS and Linux only, replaces an existing config in `~/.config/ghostty` on macOS instead of adding an overriding file, and names a new file `config` for Ghostty 1.2 and earlier targets, which do not read `config.ghostty`.
- **Preview Sample** is a menu instead of a row of buttons so all seven samples fit at narrow widths.
- On phones the theme strip uses smaller cards so the preview starts on the first screen, comparisons stack the two previews in the page instead of a nested scrolling box, primary touch controls are at least 44px, and the layout uses safe-area insets and dynamic viewport height, which shrinks with the on-screen keyboard in browsers that support `interactive-widget`. Text fields use 16px text on touch screens so mobile Safari does not zoom when they take focus.
- Platform, version, and restart notes for settings now come from the compatibility notes for the chosen target instead of fixed help text.
- The configuration preview applies the config's own `background`, `foreground`, `cursor-color`, `cursor-text`, `selection-background`, `selection-foreground`, and `palette` settings over the theme, as Ghostty does. Imported configs with these settings now preview the colors Ghostty shows; color names Atlas cannot read are listed and keep the theme color.

### Fixed

- **Copy Selected Text** offers Ghostty 1.4's Off, Selection Clipboard, System Clipboard, and Both Clipboards for a 1.4 target, and the earlier values for older targets, so the default target no longer shows a Deprecated note. Imported values stay as written.
- The preview hides the titlebar for `window-decoration = false`, which Ghostty reads as `none`.
- Fast horizontal scrolling no longer bounces back at the edge of the rendered theme cards. The catalog strip no longer uses native scroll snapping, and the arrow buttons align a card to the start edge themselves.

## 1.1.0 - 2026-10-04

### Changed

- Virtualized the horizontal theme catalog so only the visible cards and a small surrounding range are mounted, improving initial rendering and performance with large catalogs.
- Preserved keyboard navigation, focus, selected-theme scrolling, bookmarks, and comparison customization across virtualized cards and responsive layouts.
- Displayed the app version after Atlas in the site navigation and applied the accent color to Atlas.
- Added optional `GITHUB_TOKEN` authentication for the upstream theme API listing to avoid the lower anonymous rate limit. GitHub Pages checks supply the workflow token automatically; theme file downloads remain unauthenticated.

### Added

- Chromium and Firefox browser regression coverage for catalog scrolling, keyboard navigation, focus, responsive sizing, bookmarks, and comparison customization.
- A catalog benchmark and recorded measurements for the bundled catalog and a larger synthetic catalog.

## 1.0.0 - 2026-10-04

Initial release of the browser-based Ghostty theme catalog, comparison tool, and configuration editor.

### Added

- Theme catalog with search by name or catalog number, exact number lookup with `#`, and combined appearance, palette, contrast, and saved-theme filters.
- Theme bookmarks stored in browser local storage, with saved themes identified by name.
- Side-by-side theme comparison with independent previews, lockable selections, and remembered comparison theme names.
- Live terminal previews for typography, background, layout, cursor, and supported configuration settings, with labels for approximate previews and config-only controls.
- Configuration controls for typography, background, layout, cursor, behavior, and macOS settings.
- Lossless config import that preserves untouched comments, unknown directives, and line endings, with validation that blocks export of invalid editable values.
- Support for preserving unknown theme expressions while displaying a labeled fallback palette.
- Config copy and download, plus an installation script that backs up an existing config before replacing it.
- Browser-only operation without a backend or account system, with config contents and drafts kept in tab memory.
- Shared interface components built with React and Base UI, a dark interface palette, bundled Geist fonts, and Ghostty Atlas branding.
- Keyboard focus styles, responsive layouts, and reduced-motion support for cursor previews.
- Bundled Ghostty theme data and a refresh command that downloads the upstream iTerm2 Color Schemes catalog from one Git revision, records its provenance, and preserves the existing catalog if downloads or formatting fail.
- Local theme-directory overrides for catalog development and offline development with the bundled catalog.
- Vite development and production builds, ESLint and Prettier checks, and tests for config preservation, validation, catalog search, comparison state, previews, installation scripts, and theme refresh behavior.
- A pre-commit hook that refreshes and validates the catalog and app before staging the generated catalog.
- GitHub Actions checks for pull requests and GitHub Pages deployment for validated pushes to `main`, including project-subdirectory support.
- Setup, catalog, deployment, storage, and preview documentation, contribution guidelines, and a Conventional Commit guide.
