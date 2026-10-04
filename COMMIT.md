# Commit Guide

This repository uses Conventional Commit headers and plain-English bodies. The writing guidance follows the dotfiles project's preference for complete sentences, one topic per sentence, and no assistant attribution.

## Header

```text
type(scope): subject
```

Use a lowercase imperative subject without a trailing period. Keep the header under 100 characters. The scope names the part of Atlas that changes.

| Type       | Use                                                      |
| ---------- | -------------------------------------------------------- |
| `feat`     | Add user-visible behavior.                               |
| `fix`      | Correct existing behavior.                               |
| `refactor` | Change structure without changing behavior.              |
| `perf`     | Improve performance.                                     |
| `style`    | Change interface appearance.                             |
| `test`     | Add or correct test coverage.                            |
| `docs`     | Change documentation.                                    |
| `build`    | Change build tools, dependencies, or catalog generation. |
| `ci`       | Change automated checks or deployment.                   |
| `chore`    | Maintain repository configuration.                       |
| `revert`   | Revert an earlier change.                                |

Use scopes such as `app`, `catalog`, `config`, `compare`, `preview`, `ui`, `themes`, `repo`, `docs`, and `pages`. Prefer an existing spelling when it fits.

```text
fix(catalog): match numeric substrings in theme search
style(ui): highlight the active configuration category
build(themes): refresh the catalog before validation
ci(pages): deploy validated builds to GitHub Pages
```

## Body

Add a body when the header does not explain the reason, tradeoff, or migration. Use complete sentences and one topic per sentence. Avoid slash shorthand and dense lists of filenames; the diff already shows the edits.

```text
fix(catalog): match numeric substrings in theme search

Plain numeric searches previously matched only an exact catalog number.
Match both names and numbers so searching for 7 also finds 17 and 70.
Keep hash-prefixed queries available for exact number lookup.
```

Do not claim validation that was not run. Omit AI attribution, generated-by text, and assistant coauthor trailers.

## Commit Scope and Checks

Keep one concern per commit, including its supporting tests and documentation. Do not separate a rename from the import changes that make it work. Review `git diff --cached` before committing.

The pre-commit hook refreshes themes, formats the generated file, and runs lint, tests, build, and formatting checks. It stages the generated catalog only after success. Review the refreshed catalog alongside your own changes. Stage other corrections explicitly and rerun the commit if a check fails.

The project has no commit-message enforcement hook; this file is the writing convention. Normal commits use the current timestamp. A reconstructed history may use earlier author and committer dates only when the repository owner explicitly requests it.

## Breaking Changes

Use `!` after the scope and explain the incompatible behavior in a `BREAKING CHANGE:` footer.

```text
feat(config)!: change the exported configuration format

BREAKING CHANGE: Explain the affected users and how they should migrate.
```
