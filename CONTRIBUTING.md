# Contributing to Ghostty Atlas

Keep changes focused on one user-visible behavior, a refactor, or a documentation concern. Explain what changes for a person using Atlas and why.

## Issues and Labels

Use the issue form that matches your topic: Bug Report, Feature Request, Documentation, Question, or Other. Each form asks for specific details; Other keeps an open path for topics that do not fit the remaining forms. Search existing issues before submitting.

Bug reports should include reproduction steps, expected and actual behavior, browser and OS versions, and the Atlas URL or local commit. Include a minimal config example for import or export problems. Feature requests should explain the use case, proposed change, and acceptance criteria. Documentation reports should identify the affected page or text and suggest a correction. Questions should explain what you have tried. Remove private paths and sensitive values from shared configs and logs.

Report native Ghostty problems in the Ghostty project. Contribute new palettes and palette corrections to [iTerm2 Color Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes).

Repository labels use Title Case. **Bug**, **Feature Request**, **Documentation**, and **Question** identify the issue's topic. New issues receive **Needs Triage** and the form's topic label when applicable. Maintainers remove **Needs Triage** after reviewing the issue and add **Accessibility** for barriers involving keyboard access, assistive technology, contrast, or motion. **Good First Issue** identifies scoped tasks with guidance for a first contribution; **Help Wanted** identifies tasks ready for community contributions. Use **Duplicate** when an issue is already covered and link the original. Request missing information in comments, explain declined or invalid reports when closing them, and classify performance problems as bugs or feature requests.

The pull request template asks for the problem and result, important changes, related issues, actual validation results, and screenshots when applicable. Explain checks you could not run and mark checklist items only after completing them.

## Before You Open a Pull Request

1. Create a branch from `main` and target `main` in the pull request.
2. Install dependencies with `pnpm install --frozen-lockfile`.
3. Add regression tests when changing parsing, validation, catalog search, comparison state, or refresh behavior. UI styling changes should be checked visually in Firefox.
4. Update the documentation when commands, deployment, storage, or user behavior changes.
5. Run `pnpm check` and resolve every failure before submitting.

Pull requests run the same checks in GitHub Actions. They do not publish the app. Merging to `main` triggers Pages deployment.

## Development Workflow

Use `pnpm dev` while editing. Run focused tests during iteration, such as `node --test tests/theme-catalog.test.js`. Run `pnpm lint` after code changes and `pnpm format` when formatting needs correction.

The pre-commit hook runs `pnpm format` to fix formatting, then `pnpm check`: refresh and format the generated catalog, lint, tests, production build, and formatting checks. After success it stages `src/data/themes.js`, so an unrelated change can also include an upstream catalog update. Review that generated change when preparing the commit. The hook does not stage other source changes; review and stage any formatting corrections before committing. A failure stops the commit; fix the issue, stage the correction, and try again. No refresh happens after validation.

Installation sets `core.hooksPath` to `.githooks` for this checkout. Run `pnpm hooks:install` if the hook was not enabled. GitHub Actions remains the deployment gate even when a local hook is unavailable.

## Code and Tests

Use named exports, arrow functions, explicit imports, and descriptive variable names. Keep state transitions and validation separate from rendering. `ConfigDocument` is the boundary for lossless parsing: untouched imports must remain byte-for-byte identical, including unknown directives and line endings.

A regression test should demonstrate the behavior that could break. Avoid tests that merely repeat implementation details. Report the checks actually run and distinguish browser approximations from native Ghostty behavior.

For interface changes, check keyboard focus, active states, narrow layouts, and readable secondary text. Use the shared CSS tokens so cards, inputs, menus, and the transfer modal remain consistent. Keep text at least 14px except compact keyboard hints.

## Themes and Generated Files

Change theme loading and metadata generation in `scripts/`, then run refresh. Do not hand-edit `src/data/themes.js` or commit `dist/`, dependency folders, local environment values, or logs.

The upstream download uses one immutable revision per refresh. Failures must preserve the previous catalog and stop the check. A local theme directory is an explicit override for development; deployment uses upstream themes.

Theme palette contributions belong in [iTerm2 Color Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes). Atlas previews those palettes rather than maintaining a separate collection.

## Commit and Pull Request Writing

Follow [COMMIT.md](COMMIT.md). Keep separate concerns in separate commits, with the tests and documentation each concern needs.

Lead a pull request description with the problem and resulting behavior. Include relevant validation and any material limitation. Use plain English, complete sentences, and one topic per sentence. Omit generated-by text and assistant attribution.

## Deployment Changes

Keep `PAGES_BASE` aligned with the published URL. The current project path is `/ghostty-atlas/`. Check the production build at that path before changing deployment configuration.

The Pages workflow refreshes and validates before uploading `dist/`. Keep repository write permission out of the build job. Only the deployment job needs `pages: write` and `id-token: write`.
