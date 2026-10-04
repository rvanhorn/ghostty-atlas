# Ghostty Atlas

Browse Ghostty themes, compare terminal palettes, and build a configuration with a live browser preview. Atlas runs entirely in the browser; visitors do not need Ghostty installed.

[Live app](https://rvanhorn.github.io/ghostty-atlas/) · [Contributing](CONTRIBUTING.md) · [Commit guide](COMMIT.md)

## What You Can Do

- Search themes by name or catalog number. `7` matches names and numbers containing `7`; `#7` selects catalog number 7 exactly.
- Combine appearance, palette, contrast, and saved-theme filters.
- Compare two themes with independent previews and lock either side while browsing.
- Adjust typography, background, layout, cursor, behavior, and macOS settings.
- Import an existing config without losing untouched comments, unknown directives, or line endings.
- Copy or download the result, or download an installation script that backs up the existing config before replacing it.

The app uses React, Base UI, Vite, and bundled Geist fonts. Theme previews retain each terminal palette; the app interface has its own dark palette.

## Run Locally

Use Node.js 22.13 or later and pnpm 12.8.1, the version recorded in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://127.0.0.1:5173>. For another port, run `pnpm dev --port 5191`. Installation enables the repository's pre-commit hook in Git checkouts.

## Commands

| Command               | Purpose                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| `pnpm dev`            | Start the development server using the bundled catalog.                   |
| `pnpm themes:refresh` | Download the current upstream Ghostty themes.                             |
| `pnpm build`          | Refresh themes and build the static site into `dist/`.                    |
| `pnpm preview`        | Serve the production build locally; stop dev first or use another port.   |
| `pnpm test`           | Run the Node.js test suite.                                               |
| `pnpm lint`           | Run ESLint.                                                               |
| `pnpm format`         | Format source, tests, workflow, and documentation.                        |
| `pnpm check`          | Refresh and format the catalog, lint, test, build, then check formatting. |
| `pnpm hooks:install`  | Enable the pre-commit hook in an existing checkout.                       |

`pnpm check` refreshes once before validation. There is no refresh after checks pass. A failed download or check stops the command.

## Theme Catalog

[`src/data/themes.js`](src/data/themes.js) contains the catalog served to visitors. Refresh downloads the Ghostty files from [iTerm2 Color Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes), the [upstream source used by Ghostty](https://ghostty.org/docs/features/theme).

Each refresh resolves one Git revision and downloads every theme from that snapshot. The revision is recorded in the generated file. All downloads and formatting must succeed before the existing catalog is replaced. Development works offline with the bundled file; production builds and commit checks require GitHub network access.

To refresh deliberately from an installed copy instead:

```sh
pnpm themes:refresh /Applications/Ghostty.app/Contents/Resources/ghostty/themes
```

A directory argument or `GHOSTTY_THEMES_DIR` overrides the upstream download. Leave the override unset for hosting. Catalog numbers are assigned by sorted name, so they can move when upstream adds or renames themes. Saved themes use names rather than numbers.

## GitHub Pages

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) checks pull requests and deploys pushes to `main`. A manual run is also available in the Actions tab.

The build job installs the locked dependencies, refreshes themes, and runs `pnpm check`. Only a successful build is uploaded and deployed. Deployment permissions are limited to the deployment job. The workflow uses GitHub's Pages artifact and deployment actions; it does not commit build output or refreshed files back to the repository.

In repository **Settings → Pages**, select **GitHub Actions** as the publishing source. The project URL is <https://rvanhorn.github.io/ghostty-atlas/>.

`PAGES_BASE=/ghostty-atlas/` gives Vite the project subdirectory used by Pages. Local builds default to relative asset URLs. For a custom domain, change the workflow's `PAGES_BASE` to `/` and configure the domain in Pages settings.

To check the same path locally:

```sh
PAGES_BASE=/ghostty-atlas/ pnpm check
pnpm preview --port 4173
```

Open <http://127.0.0.1:4173/ghostty-atlas/>. Other static hosts can publish `dist/` after `pnpm build`. Clipboard access requires HTTPS or localhost.

## Storage and Preview Limits

Bookmarks and comparison theme names are stored in each visitor's browser local storage. Config contents and drafts remain in tab memory and are lost on reload. Atlas has no backend, database, or account system; it does not write directly to a visitor's Ghostty installation.

The preview is a static sample rather than an interactive terminal. Fonts depend on browser availability. Font size and padding use logical pixels; contrast, blur, transparency, padding balance, and window chrome approximate native rendering. Reduced motion disables cursor blinking. Controls marked **Config Only** affect the exported config without changing the sample. Controls marked **Approximate** describe browser simulations.

Import files are limited to 256 KB. Unknown settings are preserved, and invalid editable values block export until corrected. An unknown theme expression stays in the config while a labeled fallback palette is previewed.

## Repository Layout

| Path                       | Contents                                                                   |
| -------------------------- | -------------------------------------------------------------------------- |
| `src/components/`          | Header, cards, theme picker, controls, and terminal preview.               |
| `src/features/gallery/`    | Catalog filters and the scrolling theme strip.                             |
| `src/features/comparison/` | Comparison state and paired previews.                                      |
| `src/features/config/`     | Lossless config parsing, validation, settings, and transfer dialog.        |
| `src/shared/`              | Browser preferences and theme numbering and search.                        |
| `src/data/themes.js`       | Generated theme catalog.                                                   |
| `src/styles/`              | UI tokens and component styles.                                            |
| `scripts/`                 | Theme refresh and hook installation.                                       |
| `tests/`                   | Config preservation, preview behavior, catalog, refresh, and state checks. |
| `.githooks/`               | Pre-commit validation.                                                     |
| `.github/workflows/`       | GitHub Pages checks and deployment.                                        |

## Credits

Terminal palettes come from iTerm2 Color Schemes. Geist and Geist Mono are bundled from Vercel's Geist project, version 1.4.2, under the [SIL Open Font License](src/assets/fonts/LICENSE.txt).
