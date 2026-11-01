# Ghostty Atlas

Browse Ghostty themes, compare terminal palettes, and build a configuration with a live browser preview. Atlas runs entirely in the browser; visitors do not need Ghostty installed.

[Live app](https://rvanhorn.github.io/ghostty-atlas/) · [Changelog](CHANGELOG.md) · [Contributing](CONTRIBUTING.md) · [Commit guide](COMMIT.md)

## What You Can Do

- Search themes by name or catalog number. `7` matches names and numbers containing `7`; `#7` selects catalog number 7 exactly.
- Combine appearance, palette, contrast, and saved-theme filters.
- Sort themes by background brightness or saturation in either direction, or find themes similar to one you like.
- Inspect a theme's window colors and labeled ANSI colors 0–15, and copy any hex value.
- Compare two themes with independent previews and lock either side while browsing.
- Preview Shell, Code, Typography, ANSI Colors, Git Diff, Dense Log, and Terminal UI samples; both comparison sides show the same one.
- Share a link to the current theme, or to a two-theme comparison, with the selected preview sample.
- Configure separate light and dark themes, which Ghostty switches with the system appearance, and preview either one.
- Adjust typography, palette, background, layout, cursor, behavior, window, macOS, and Linux settings, and preview macOS or Linux window chrome.
- Randomize the theme and nearly every setting to explore new combinations, then undo a step or restore the config you started from.
- Edit a theme's window and ANSI colors, then export them as a Ghostty theme file or import a theme file's colors.
- Import an existing config without losing untouched comments, unknown directives, or line endings.
- Copy or download the result, or download a macOS and Linux installation script that backs up the existing config before replacing it. The script replaces the config file Ghostty already reads, including one in `~/.config/ghostty` on macOS, and names a new file `config.ghostty`, or `config` for a Ghostty 1.2 or earlier target.
- Recover an unfinished config after a reload, and save, load, rename, and delete named presets such as Laptop, Work, and Presentation.

The app uses React, Base UI, Vite, and bundled Geist fonts. Theme previews retain each terminal palette; the app interface has its own dark palette.

## Run Locally

Use Node.js 22.13 or later and pnpm 12.8.1, the version recorded in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://127.0.0.1:5173>. For another port, run `pnpm dev --port 5191`. Installation enables the repository's pre-commit hook in Git checkouts.

## Commands

| Command                  | Purpose                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `pnpm dev`               | Start the development server using the bundled catalog.                   |
| `pnpm themes:refresh`    | Download the current upstream Ghostty themes.                             |
| `pnpm build`             | Refresh themes and build the static site into `dist/`.                    |
| `pnpm preview`           | Serve the production build locally; stop dev first or use another port.   |
| `pnpm test`              | Run the Vitest suite once.                                                |
| `pnpm test:browser`      | Check catalog interactions in Chromium and Firefox with Playwright.       |
| `pnpm benchmark:catalog` | Measure catalog rendering, search, DOM size, and scrolling.               |
| `pnpm test:watch`        | Run Vitest in watch mode while editing.                                   |
| `pnpm lint`              | Run Oxlint.                                                               |
| `pnpm format`            | Format source, tests, workflow, and documentation with Oxfmt.             |
| `pnpm check`             | Refresh and format the catalog, lint, test, build, then check formatting. |
| `pnpm hooks:install`     | Enable the pre-commit hook in an existing checkout.                       |

`pnpm check` refreshes once before validation. There is no refresh after checks pass. A failed download or check stops the command.

## Theme Catalog

[`src/data/themes.js`](src/data/themes.js) contains the catalog served to visitors. Refresh downloads the Ghostty files from [iTerm2 Color Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes), the [upstream source used by Ghostty](https://ghostty.org/docs/features/theme).

Each refresh resolves one Git revision and downloads every theme from that snapshot. The revision is recorded in the generated file. All downloads and formatting must succeed before the existing catalog is replaced. Development works offline with the bundled file; production builds and commit checks require GitHub network access.

To refresh deliberately from an installed copy instead:

```sh
pnpm themes:refresh /Applications/Ghostty.app/Contents/Resources/ghostty/themes
```

A directory argument or `GHOSTTY_THEMES_DIR` overrides the upstream download. Leave the override unset for hosting. Catalog numbers are assigned by sorted name, so they can move when upstream adds or renames themes. Saved themes use names rather than numbers.

Set `GITHUB_TOKEN` to authenticate the upstream GitHub API listing and avoid the lower anonymous rate limit. The Pages workflow supplies its built-in token automatically; theme file downloads do not receive the token.

## GitHub Pages

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) checks pull requests and deploys pushes to `main`. A manual run is also available in the Actions tab.

The build job installs the locked dependencies, refreshes themes, and runs `pnpm check`. A separate browser job checks catalog interactions in Chromium and Firefox using the bundled catalog. Deployment requires both jobs to pass. Deployment permissions are limited to the deployment job. The workflow uses GitHub's Pages artifact and deployment actions; it does not commit build output or refreshed files back to the repository. See [CONTRIBUTING.md](CONTRIBUTING.md) for browser setup and catalog performance measurements.

In repository **Settings → Pages**, select **GitHub Actions** as the publishing source. The project URL is <https://rvanhorn.github.io/ghostty-atlas/>.

`PAGES_BASE=/ghostty-atlas/` gives Vite the project subdirectory used by Pages. Local builds default to relative asset URLs. For a custom domain, change the workflow's `PAGES_BASE` to `/` and configure the domain in Pages settings.

Shared links use Open Graph and large-image card metadata in `src/index.html`. The 1200 × 630 image in `src/public/social-preview.png` includes the project logo and feature badges, and Vite copies it unchanged into the build. When changing the public site URL, also update the canonical, Open Graph, and card image URLs in `src/index.html`. Chat apps control the final card layout and may cache previews until they fetch the link again.

To check the same path locally:

```sh
PAGES_BASE=/ghostty-atlas/ pnpm check
pnpm preview --port 4173
```

Open <http://127.0.0.1:4173/ghostty-atlas/>. Other static hosts can publish `dist/` after `pnpm build`. Clipboard access requires HTTPS or localhost.

## Storage and Preview Limits

Bookmarks and comparison theme names are stored in each visitor's browser local storage under `ghostty-atlas`. The latest unfinished config is stored as a draft under `ghostty-atlas-draft`, and named presets under `ghostty-atlas-presets`, both in this browser's local storage only. On return, Atlas offers to restore or discard the draft, including its imported source, pending values, and values that still need fixing. Each record carries a version; Atlas leaves records from another version untouched, and works without saving when storage is unavailable or full. **Clear Saved Configs** in the Presets tab of Import / Export removes the draft and every preset but keeps bookmarks. Atlas has no backend, database, or account system; it does not write directly to a visitor's Ghostty installation.

**Share** builds a link at the deployed path with theme names and the preview sample in the query string: `?theme=Nord&sample=code` for one theme, or `?left=Nord&right=Dracula&sample=code` for a comparison. Sample values are `shell`, `code`, `text`, `ansi`, `diff`, `log`, and `tui`. Links never include config text, unknown directives, or file names. Atlas removes these values from the address once it reads them, names any unknown theme or sample it ignored, and still offers a stored draft; restoring that draft keeps its own theme and offers to apply the shared one. When clipboard access fails, the link stays selected in a read-only field for manual copying. With a light and dark pair, the link carries the previewed member as `?theme=`.

Atlas prepares configs for Ghostty on macOS and Linux, the platforms Ghostty supports; it runs in any modern browser. Settings are grouped by where Ghostty uses them: **Window** holds window appearance, decorations, and the title font, which both platforms share; **macOS** and **Linux** hold settings only that platform reads, and the setting help names each setting's platform and first Ghostty version. **Platform** above the preview chooses macOS or Linux window chrome and is the same target as **Your Target** in Review Changes. The Linux chrome approximates a GNOME window with Ghostty's GTK titlebar, so other desktops and window managers can look different, and macOS titlebar settings do not affect it. Switching platforms or categories never changes the config; settings for the other platform and directives Atlas does not edit are kept as written.

The preview is a static sample rather than an interactive terminal. Fonts depend on browser availability. Box-drawing and block characters come from the browser font, while Ghostty draws them itself, so line joins and weights can differ; bold, italic, dim, underline, and inverse text use browser styles. Font size and padding use logical pixels; contrast, blur, transparency, padding balance, and window chrome approximate native rendering. Reduced motion disables cursor blinking. Controls marked **Config Only** affect the exported config without changing the sample. Controls marked **Approximate** describe browser simulations.

Import files are limited to 256 KB. Unknown settings are preserved, and invalid editable values block export until corrected. An unknown theme expression stays in the config while a labeled fallback palette is previewed.

**Review Changes** in the Export tab compares the export with the imported or starter config and lists each added, removed, or modified setting with its lines. Atlas rewrites only the settings you edit, so comments, unknown directives, and line endings never appear as changes. The same view sets **Your Target**, a platform (macOS or Linux) and Ghostty version (1.0 to 1.4) that you choose; Atlas does not detect your installation, and the choice lasts for the session. For that target, the review and the setting help explain settings or values Ghostty does not support, deprecated values, and changes that need a restart or apply only to new windows or terminals, each with a link to Ghostty's documentation. The notes cover only the settings listed in `src/features/config/compatibility.js`; Atlas keeps every setting as written and checks nothing else.

**Light & Dark** mode writes Ghostty's `theme = light:Name,dark:Name` form. Atlas does not detect the system appearance for the preview; the Light and Dark toggle chooses which member to preview, and theme cards set that member. An imported pair in either order, with any surrounding whitespace, stays unchanged until edited. Missing, unlabeled, or uncataloged members are explained and the expression is kept as written. Switching to **Single Theme** keeps the previewed member; switching back restores an imported pair or starts a pair with the current theme on both sides.

**Palette** edits are written to the config as Ghostty color settings (`background`, `foreground`, `cursor-color`, `cursor-text`, `selection-background`, `selection-foreground`, and `palette = N=#rrggbb`), which Ghostty applies over any theme, including both members of a light and dark pair. The preview applies the same settings from an imported config. Atlas reads hex colors only; X11 color names stay in the config and are listed, and the preview shows the theme color for them. Undo history lasts for the session. **Export Theme File** writes the 22 colors to a theme file named after the theme; save it without an extension in `~/.config/ghostty/themes/` (or `$XDG_CONFIG_HOME/ghostty/themes/`) and set `theme = <name>`, or reference it by absolute path. The catalog itself never changes; new shared palettes belong in iTerm2 Color Schemes.

**Randomize**, beside the Preview Sample menu, picks a catalog theme other than the current one and a value for nearly every setting, so the theme strip, editor, preview, and export all show the same result. Choices come from each setting's options for **Your Target**, practical ranges on the setting's step (for example font sizes 11 to 20 and opacity 0.7 to 1), and the fonts the Font Family and Title & Tab Font fields suggest. A light and dark pair stays a pair, with a light theme for the light member and a dark theme for the dark one. Settings that would do nothing return to Ghostty's default: blur without transparency, macOS Window Appearance and Titlebar Folder Icon without a native titlebar, window buttons and title font with a hidden titlebar, Linux titlebar colors without Ghostty Colors, titlebar style without the GTK titlebar, and tab position and wide tabs with the tab bar set to Never. Randomize leaves these unchanged:

- Palette colors. The random catalog theme is the palette randomization, and color settings are your own edits that Ghostty applies over any theme.
- Settings and values the target does not support or has deprecated, such as Linux settings for a macOS target, values that need a later Ghostty version, and `scrollback-limit` for Ghostty 1.4, which renamed it.
- Comments and directives Atlas does not edit.

It never sets Confirm Before Closing to Never, which could close a running process without a warning, and gives Font Family one family rather than a fallback list. **Undo Randomize** steps back one randomization; **Restore Previous Config** returns to the config from before the first randomization, including imported values. Both last until any other edit, and the history is not stored. The randomized config is saved as a draft like any other edit.

## Sorting and Similar Themes

The palette button on each theme card opens its colors: background, foreground, cursor, selection, and ANSI 0–15, each labeled and copyable with a click, Enter, or Space. **Find Similar Themes** in that view sets the **Sort** order in the filter bar to similarity with that theme.

Search and filters decide which themes appear; the sort order only arranges them. Similarity ranks the themes that match the current search and filters, leaves out the theme it compares against, and stays available in **Sort** until another theme replaces it. Clearing the search or filters keeps the sort order. When nothing matches, **Clear Search and Filters** restores the list in the same order.

Atlas computes these orders from the bundled palettes in the browser, with no tags to maintain. Colors are compared in OKLab, a perceptual color space where equal distances look about equally different. Brightness is the background's OKLab lightness and saturation its OKLCH chroma. Similarity is a weighted mean of color distances: background 40%, because it fills most of the terminal; foreground 20%, because it colors most text; and the 16 ANSI colors 40% together, because they shape prompts and syntax but each covers little of the screen. Equal values are ordered by theme name, so every order is deterministic.

## Repository Layout

| Path                       | Contents                                                                   |
| -------------------------- | -------------------------------------------------------------------------- |
| `src/components/`          | Header, cards, theme picker, controls, and terminal preview.               |
| `src/features/gallery/`    | Catalog filters, sorting, similarity, the strip, and the palette view.     |
| `src/features/comparison/` | Comparison state and paired previews.                                      |
| `src/features/config/`     | Lossless config parsing, validation, settings, drafts, presets, transfer.  |
| `src/features/palette/`    | Color overrides, the palette editor, and theme file import and export.     |
| `src/features/share/`      | Shared link parsing and building, the share dialog, and link notices.      |
| `src/shared/`              | Preferences, preview samples, theme search, and OKLab color math.          |
| `src/data/themes.js`       | Generated theme catalog.                                                   |
| `src/styles/`              | UI tokens and component styles.                                            |
| `scripts/`                 | Theme refresh and hook installation.                                       |
| `tests/`                   | Config preservation, preview behavior, catalog, refresh, and state checks. |
| `.githooks/`               | Pre-commit validation.                                                     |
| `.github/workflows/`       | GitHub Pages checks and deployment.                                        |

## Credits

Terminal palettes come from iTerm2 Color Schemes. Geist and Geist Mono are bundled from Vercel's Geist project, version 1.4.2, under the [SIL Open Font License](src/assets/fonts/LICENSE.txt).
