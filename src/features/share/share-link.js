import { findTheme } from "../../data/themes.js";
import { previewSamples } from "../../shared/preview-samples.js";

/* A shared link carries theme names and the preview sample in the query string.
   Config text, unknown directives, and file names never enter a link. */
export const shareKeys = ["theme", "left", "right", "sample"];

const sampleIds = previewSamples.map(([id]) => id);
const quoteLimit = 60;

const quote = (value) =>
  `“${value.length > quoteLimit ? `${value.slice(0, quoteLimit)}…` : value}”`;

// Returns null when the address holds no shared state; each ignored part is listed for the user.
export const parseShareLink = (search) => {
  const params = new URLSearchParams(search);
  if (!shareKeys.some((key) => params.has(key))) return null;
  const ignored = [];
  const read = (key) => {
    const values = params.getAll(key);
    if (values.length > 1) ignored.push(`repeated “${key}” values`);
    return values[0] ?? null;
  };
  const readTheme = (key, description) => {
    const name = read(key);
    if (name === null) return null;
    if (findTheme(name)) return name;
    ignored.push(
      name.trim()
        ? `unknown ${description} ${quote(name)}`
        : `empty ${description}`,
    );
    return null;
  };
  const comparing = params.has("left") || params.has("right");
  const left = readTheme("left", "left theme");
  const right = readTheme("right", "right theme");
  if (comparing && !params.has("left")) ignored.push("missing left theme");
  if (comparing && !params.has("right")) ignored.push("missing right theme");
  let theme = null;
  if (comparing && params.has("theme"))
    ignored.push("“theme”, because the link compares two themes");
  else theme = readTheme("theme", "theme");
  const requestedSample = read("sample");
  const sample = sampleIds.includes(requestedSample) ? requestedSample : null;
  if (requestedSample !== null && !sample)
    ignored.push(`unknown preview sample ${quote(requestedSample)}`);
  return {
    comparing: comparing && Boolean(left || right),
    theme,
    left,
    right,
    sample,
    ignored,
  };
};

export const describeIgnored = (ignored) =>
  ignored.length
    ? `Part of the shared link was ignored: ${ignored.join("; ")}.`
    : "";

export const createShareSearch = ({ comparing, theme, left, right, sample }) =>
  new URLSearchParams(
    comparing ? { left, right, sample } : { theme, sample },
  ).toString();

// Keeps the deployed path, such as /ghostty-atlas/, and drops every other query value and the hash.
export const createShareUrl = (href, state) => {
  const url = new URL(href);
  return `${url.origin}${url.pathname}?${createShareSearch(state)}`;
};

// The address Atlas shows once a shared link is read, so a reload does not apply it again.
export const removeShareParams = (href) => {
  const url = new URL(href);
  shareKeys.forEach((key) => url.searchParams.delete(key));
  return `${url.pathname}${url.search}${url.hash}`;
};
