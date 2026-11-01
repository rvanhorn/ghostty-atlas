/* Theme families group the light and dark variants of one theme, such as
   Solarized Dark and Solarized Light, from their names alone.

   A name is split into words at spaces and punctuation. The family name is
   the words before the last variant word, which is never the first word:
   "GitHub Dark Colorblind" and "GitHub Light High Contrast" both belong to
   GitHub, "Lumina Dusk Dark" to Lumina Dusk, and "datum (dark)" to datum. A
   first word that is a variant word is dropped only when another name differs
   from this one in just that word, so Night Owl and Light Owl are the Owl
   family while Dark Pastel stays alone. A name without a variant word is its
   own family name. Named flavors that are not
   variant words in general belong to their family through `namedFlavors`
   (the word after the family name) or `namedMembers` (whole names). Matching
   ignores case and accents, so Rosé Pine and Rose Pine are one family. */
import { themes } from "../../data/themes.js";

export const variantWords = [
  "light",
  "dark",
  "day",
  "night",
  "dawn",
  "dusk",
  "moon",
];

export const namedFlavors = {
  Ayu: ["Mirage"],
  Catppuccin: ["Latte", "Frappe", "Macchiato", "Mocha"],
  Havn: ["Daggry", "Skumring"],
  Kanagawa: ["Dragon", "Lotus", "Wave"],
  Modus: ["Operandi", "Vivendi"],
  TokyoNight: ["Storm"],
};

export const namedMembers = {
  Nightfox: [
    "Carbonfox",
    "Dawnfox",
    "Dayfox",
    "Duskfox",
    "Nightfox",
    "Nordfox",
    "Terafox",
  ],
};

const normalize = (word) =>
  word
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const memberFamilies = new Map(
  Object.entries(namedMembers).flatMap(([family, members]) =>
    members.map((member) => [normalize(member), family]),
  ),
);

const flavorFamilies = new Map(
  Object.entries(namedFlavors).map(([family, flavors]) => [
    normalize(family),
    { family, flavors: new Set(flavors.map(normalize)) },
  ]),
);

/* Words of a name, leaving out parenthesized phrases of more than one word,
   which name a variant's subject rather than its appearance, as in Black Metal
   (Dark Funeral). A one-word parenthesis such as "(dark)" stays. */
const splitWords = (themeName) =>
  themeName
    .replace(/\([^)]*\s[^)]*\)/g, " ")
    .split(/[^\p{L}\p{N}+]+/u)
    .filter(Boolean);

// The rest of a name that starts with a variant word, such as "Owl" in Night Owl; null otherwise.
const getLeadingRemainder = (themeName) => {
  const words = splitWords(themeName);
  return words.length > 1 && variantWords.includes(normalize(words[0]))
    ? words.slice(1).join(" ")
    : null;
};

const pairedRemaindersCache = new WeakMap();

// Remainders that at least two names starting with a variant word share in a catalog.
const getPairedRemainders = (catalog) => {
  let paired = pairedRemaindersCache.get(catalog);
  if (!paired) {
    const counts = new Map();
    catalog.forEach((theme) => {
      const remainder = getLeadingRemainder(theme.name);
      if (remainder)
        counts.set(
          normalize(remainder),
          (counts.get(normalize(remainder)) ?? 0) + 1,
        );
    });
    paired = new Set(
      [...counts].filter(([, count]) => count > 1).map(([key]) => key),
    );
    pairedRemaindersCache.set(catalog, paired);
  }
  return paired;
};

/* { name, key } of a theme's family: the name is shown to people, and themes
   share a family when their keys match. A leading variant word is dropped only
   when another name in the catalog differs from this one just in that word,
   as Night Owl and Light Owl do; such a family's key is marked so it never
   merges with a theme whose whole name is the remainder. */
const describeFamily = (themeName, catalog) => {
  const named = memberFamilies.get(normalize(themeName));
  if (named) return { name: named, key: normalize(named) };
  const words = splitWords(themeName);
  const flavor = flavorFamilies.get(normalize(words[0] ?? ""));
  if (flavor && words[1] && flavor.flavors.has(normalize(words[1])))
    return { name: flavor.family, key: normalize(flavor.family) };
  const remainder = getLeadingRemainder(themeName);
  if (remainder && getPairedRemainders(catalog).has(normalize(remainder)))
    return { name: remainder, key: `${normalize(remainder)} (variants)` };
  const cut = words.findLastIndex(
    (word, index) => index > 0 && variantWords.includes(normalize(word)),
  );
  const name = cut > 0 ? words.slice(0, cut).join(" ") : themeName;
  return { name, key: normalize(name) };
};

export const getFamilyName = (themeName, catalog = themes) =>
  describeFamily(themeName, catalog).name;

export const getFamilyKey = (themeName, catalog = themes) =>
  describeFamily(themeName, catalog).key;

const familyCache = new WeakMap();

/* Groups a catalog into families: a Map from family key to
   { key, name, members, light, dark }, where members keep catalog order and
   light and dark count the members of each appearance. Computed once per
   catalog array. */
export const groupThemeFamilies = (catalog) => {
  let families = familyCache.get(catalog);
  if (families) return families;
  families = new Map();
  catalog.forEach((theme) => {
    const { key, name } = describeFamily(theme.name, catalog);
    if (!families.has(key))
      families.set(key, {
        key,
        name,
        members: [],
        light: 0,
        dark: 0,
      });
    const family = families.get(key);
    family.members.push(theme);
    if (theme.appearance === "light") family.light += 1;
    else family.dark += 1;
  });
  familyCache.set(catalog, families);
  return families;
};

export const getThemeFamily = (catalog, theme) =>
  groupThemeFamilies(catalog).get(getFamilyKey(theme.name, catalog));

export const hasLightAndDark = (family) =>
  Boolean(family && family.light && family.dark);

// A name without its variant and flavor words, used to match counterparts such as GitHub Dark Colorblind and GitHub Light Colorblind.
const getVariantBase = (themeName) => {
  const words = splitWords(themeName);
  const flavors = flavorFamilies.get(normalize(words[0] ?? ""))?.flavors;
  return words
    .filter(
      (word, index) =>
        index === 0 ||
        !(
          variantWords.includes(normalize(word)) ||
          flavors?.has(normalize(word))
        ),
    )
    .map(normalize)
    .join(" ");
};

/* The light and dark pair a theme suggests within its family: the theme itself
   for its own appearance, and for the other appearance the member whose name
   differs only in variant words, or else the family's first member of that
   appearance. Null when the family lacks either appearance. */
export const suggestFamilyPair = (catalog, theme) => {
  const family = getThemeFamily(catalog, theme);
  if (!hasLightAndDark(family)) return null;
  const own = theme.appearance === "light" ? "light" : "dark";
  const other = own === "light" ? "dark" : "light";
  const candidates = family.members.filter(
    (member) => (member.appearance === "light") === (other === "light"),
  );
  const base = getVariantBase(theme.name);
  const counterpart =
    candidates.find((member) => getVariantBase(member.name) === base) ??
    candidates[0];
  return { [own]: theme.name, [other]: counterpart.name };
};
