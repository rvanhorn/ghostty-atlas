import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeCard } from "../../components/theme-card.jsx";
import { Button } from "../../components/ui/button.jsx";

export const ThemeStrip = ({
  themes,
  sample,
  selectedThemeName,
  savedThemes,
  onSelect,
  onToggleSaved,
  onClearFilters,
  resetKey,
}) => {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const cardRefs = useRef(new Map());
  const pendingFocus = useRef(null);
  const previousSelection = useRef(null);
  const previousCardWidth = useRef(296);
  const [cardWidth, setCardWidth] = useState(296);
  const [focusedThemeName, setFocusedThemeName] = useState(null);
  const focusedIndex = themes.findIndex(
    (theme) => theme.name === focusedThemeName,
  );
  const getItemKey = useCallback((index) => themes[index].name, [themes]);
  const rangeExtractor = useCallback(
    (range) => {
      const indexes = defaultRangeExtractor(range);
      // Retain both the pick and bookmark controls while either has focus.
      if (focusedIndex >= 0 && !indexes.includes(focusedIndex)) {
        indexes.push(focusedIndex);
        indexes.sort((left, right) => left - right);
      }
      return indexes;
    },
    [focusedIndex],
  );
  // The mutable virtualizer is intentionally read each render; this app does not use React Compiler.
  // oxlint-disable-next-line react/incompatible-library
  const virtualizer = useVirtualizer({
    count: themes.length,
    getScrollElement: () => viewportRef.current,
    horizontal: true,
    estimateSize: () => cardWidth,
    getItemKey,
    rangeExtractor,
    overscan: 3,
    gap: 16,
    paddingStart: 16,
    paddingEnd: 16,
    scrollPaddingStart: 16,
    scrollPaddingEnd: 16,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const [scrollBounds, setScrollBounds] = useState({
    atStart: true,
    atEnd: false,
  });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const updateCardWidth = () =>
      setCardWidth(
        Number.parseFloat(
          getComputedStyle(viewport).getPropertyValue("--theme-card-width"),
        ),
      );
    updateCardWidth();
    const observer = new ResizeObserver(updateCardWidth);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (previousCardWidth.current === cardWidth) return;
    const offset = viewportRef.current.scrollLeft;
    const logicalOffset =
      Math.max(0, offset - 16) / (previousCardWidth.current + 16);
    previousCardWidth.current = cardWidth;
    virtualizer.measure();
    virtualizer.scrollToOffset(
      offset ? 16 + logicalOffset * (cardWidth + 16) : 0,
    );
  }, [cardWidth, virtualizer]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const updateScrollBounds = () =>
      setScrollBounds({
        atStart: viewport.scrollLeft <= 1,
        atEnd:
          viewport.scrollLeft + viewport.clientWidth >=
          viewport.scrollWidth - 1,
      });
    const observer = new ResizeObserver(updateScrollBounds);
    observer.observe(viewport);
    observer.observe(trackRef.current);
    updateScrollBounds();
    viewport.addEventListener("scroll", updateScrollBounds, { passive: true });
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", updateScrollBounds);
    };
  }, []);

  useLayoutEffect(() => {
    virtualizer.scrollToOffset(0);
  }, [resetKey, virtualizer]);
  useLayoutEffect(() => {
    // Filtering resets the strip without jumping back to an unchanged selection.
    if (previousSelection.current === selectedThemeName) return;
    previousSelection.current = selectedThemeName;
    const index = themes.findIndex((theme) => theme.name === selectedThemeName);
    if (index >= 0) virtualizer.scrollToIndex(index, { align: "auto" });
  }, [selectedThemeName, themes, virtualizer]);

  useLayoutEffect(() => {
    if (focusedThemeName && focusedIndex < 0) {
      pendingFocus.current = null;
      setFocusedThemeName(null);
      viewportRef.current.focus({ preventScroll: true });
    }
    const button = cardRefs.current
      .get(pendingFocus.current)
      ?.querySelector(".theme-card-pick");
    if (button) {
      pendingFocus.current = null;
      button.focus({ preventScroll: true });
    }
  }, [focusedIndex, focusedThemeName, virtualItems]);

  const scrollThemes = (direction) => {
    const viewport = viewportRef.current;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    viewport.scrollBy({
      left: direction * viewport.clientWidth * 0.85,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  };
  const navigateThemes = (event) => {
    const cardButton = event.target.closest(".theme-card-pick");
    if (
      !cardButton ||
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    )
      return;
    const currentIndex = Number(
      cardButton.closest(".theme-strip-item").dataset.index,
    );
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? themes.length - 1
          : Math.max(
              0,
              Math.min(
                themes.length - 1,
                currentIndex + (event.key === "ArrowRight" ? 1 : -1),
              ),
            );
    event.preventDefault();
    const theme = themes[nextIndex];
    if (!theme) return;
    pendingFocus.current = theme.name;
    setFocusedThemeName(theme.name);
    virtualizer.scrollToIndex(nextIndex, { align: "auto" });
    onSelect(theme);
  };

  return (
    <section className="theme-strip" aria-label="Theme Catalog">
      <Button
        variant="quiet"
        className="theme-strip-arrow"
        aria-label="Scroll Themes Left"
        disabled={scrollBounds.atStart}
        onClick={() => scrollThemes(-1)}
      >
        <ChevronLeft size={18} />
      </Button>
      <div
        className="theme-strip-viewport"
        data-fade-left={!scrollBounds.atStart}
        data-fade-right={!scrollBounds.atEnd}
        ref={viewportRef}
        tabIndex={-1}
        onKeyDown={navigateThemes}
        onFocusCapture={(event) => {
          const item = event.target.closest(".theme-strip-item");
          if (item)
            setFocusedThemeName(themes[Number(item.dataset.index)].name);
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setFocusedThemeName(null);
          }
        }}
      >
        <div
          className="theme-strip-track"
          ref={trackRef}
          role="list"
          aria-label="Matching Themes"
          style={{
            width: virtualizer.getTotalSize(),
            height: themes.length ? "100%" : 0,
          }}
        >
          {virtualItems.map((item) => {
            const theme = themes[item.index];
            return (
              <div
                key={item.key}
                className="theme-strip-item"
                data-index={item.index}
                role="listitem"
                aria-posinset={item.index + 1}
                aria-setsize={themes.length}
                style={{ left: item.start, width: item.size }}
                ref={(node) => {
                  if (node) cardRefs.current.set(theme.name, node);
                  else cardRefs.current.delete(theme.name);
                }}
              >
                <ThemeCard
                  theme={theme}
                  sample={sample}
                  selected={theme.name === selectedThemeName}
                  saved={savedThemes.includes(theme.name)}
                  onSelect={onSelect}
                  onToggleSaved={onToggleSaved}
                />
              </div>
            );
          })}
        </div>
        {!themes.length && (
          <div className="empty-state">
            <h2>No Matching Themes</h2>
            <p>Try another search or clear your filters.</p>
            <Button onClick={onClearFilters}>Clear Search and Filters</Button>
          </div>
        )}
      </div>
      <Button
        variant="quiet"
        className="theme-strip-arrow"
        aria-label="Scroll Themes Right"
        disabled={scrollBounds.atEnd}
        onClick={() => scrollThemes(1)}
      >
        <ChevronRight size={18} />
      </Button>
    </section>
  );
};
