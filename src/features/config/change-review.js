import { ConfigDocument } from "./config-document.js";

const lineText = (raw) => raw.replace(/[\r\n]+$/, "");

// Lines only in `before` are removed and lines only in `after` are added, in order.
const diffLines = (before, after) => {
  const lengths = Array.from({ length: before.length + 1 }, () =>
    new Array(after.length + 1).fill(0),
  );
  for (let i = before.length - 1; i >= 0; i--)
    for (let j = after.length - 1; j >= 0; j--)
      lengths[i][j] =
        before[i] === after[j]
          ? lengths[i + 1][j + 1] + 1
          : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
  const removed = [];
  const added = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      i++;
      j++;
    } else if (
      j === after.length ||
      (i < before.length && lengths[i + 1][j] >= lengths[i][j + 1])
    )
      removed.push(before[i++]);
    else added.push(after[j++]);
  }
  return { removed, added };
};

/* Changes between the imported or starter source and the export, one entry per edited
   setting in config order. Only edited settings are rewritten, so comments, unknown
   directives and untouched settings never appear. Line endings are not compared:
   the export keeps them for untouched lines and uses the source's own for new ones. */
export const reviewChanges = (document) => {
  const exported = new ConfigDocument(document.export());
  const linesFor = (lines, key) =>
    lines.filter((line) => line.key === key).map((line) => lineText(line.raw));
  const position = (key) => {
    const index = exported.lines.findIndex((line) => line.key === key);
    return index === -1
      ? document.lines.findIndex((line) => line.key === key)
      : index;
  };
  return [...document.edits.keys()]
    .map((key) => {
      const before = linesFor(document.lines, key);
      const after = linesFor(exported.lines, key);
      const { removed, added } = diffLines(before, after);
      const kind = !before.length
        ? "added"
        : !after.length
          ? "removed"
          : "modified";
      return { key, kind, removed, added };
    })
    .filter((change) => change.removed.length || change.added.length)
    .sort((first, second) => position(first.key) - position(second.key));
};

export const summarizeChanges = (changes) => {
  const count = (kind) =>
    changes.filter((change) => change.kind === kind).length;
  const parts = [
    [count("modified"), "modified"],
    [count("added"), "added"],
    [count("removed"), "removed"],
  ]
    .filter(([total]) => total)
    .map(([total, label]) => `${total} ${label}`);
  return parts.length
    ? `${changes.length} ${changes.length === 1 ? "setting" : "settings"} changed: ${parts.join(", ")}.`
    : "No changes.";
};
