# Changelog

All notable changes to Ghostty Atlas are documented here, grouped by release.

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
