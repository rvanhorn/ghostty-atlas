import { StrictMode, useLayoutEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { themes } from "../../src/data/themes.js";
import { ThemeStrip } from "../../src/features/gallery/theme-strip.jsx";
import "../../src/styles/fonts.css";
import "../../src/styles/styles.css";
import "../../src/styles/components.css";
import "../../src/styles/catalog.css";

const copies =
  Number(new URLSearchParams(window.location.search).get("copies")) || 1;
const catalog = Array.from({ length: copies }, (_, copy) =>
  themes.map((theme) =>
    copy ? { ...theme, name: `${theme.name} Copy ${copy}` } : theme,
  ),
).flat();
const Fixture = () => {
  const [selected, setSelected] = useState(catalog[0].name);
  const [query, setQuery] = useState("");
  const [sample, setSample] = useState("shell");
  const [saved, setSaved] = useState([]);
  const filtered = useMemo(
    () =>
      catalog.filter((theme) =>
        theme.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  useLayoutEffect(() => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.fixturePaint = performance.now();
      }),
    );
  }, [query]);
  return (
    <>
      <input
        aria-label="Search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button onClick={() => setSelected(catalog.at(-1).name)}>
        Select Last
      </button>
      <button onClick={() => setSample("code")}>Code Sample</button>
      <output aria-label="Result Count">{filtered.length}</output>
      <output aria-label="Selected Theme">{selected}</output>
      <ThemeStrip
        themes={filtered}
        sample={sample}
        selectedThemeName={selected}
        savedThemes={saved}
        onSelect={(theme) => setSelected(theme.name)}
        onToggleSaved={(name) =>
          setSaved((current) =>
            current.includes(name)
              ? current.filter((value) => value !== name)
              : [...current, name],
          )
        }
        onClearFilters={() => setQuery("")}
        resetKey={query}
      />
    </>
  );
};
window.fixtureStart = performance.now();
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
